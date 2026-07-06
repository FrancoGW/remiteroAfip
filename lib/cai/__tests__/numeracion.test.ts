import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import CaiAutorizacionModel from "@/lib/db/models/CaiAutorizacion";
import type { obtenerProximoNumeroRemito as ObtenerProximoNumeroRemitoFn } from "../numeracion";

// Estos tests levantan un mongod EN MEMORIA, aislado y descartable — no tocan
// la base de datos de desarrollo (MONGODB_URI) en ningún momento. Los CAI
// usados son fixtures inventados para el test, no el CAI real de la empresa.
//
// `lib/db/mongodb.ts` lee MONGODB_URI en una constante a nivel de módulo, así
// que hay que fijar la variable de entorno ANTES de que ese módulo se evalúe.
// Por eso el import de `numeracion` (que lo arrastra) se hace de forma
// dinámica dentro de beforeAll, después de levantar el mongod en memoria.

let mongod: MongoMemoryServer;
let obtenerProximoNumeroRemito: typeof ObtenerProximoNumeroRemitoFn;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();

  const numeracionModule = await import("../numeracion");
  obtenerProximoNumeroRemito = numeracionModule.obtenerProximoNumeroRemito;

  const { default: connectDB } = await import("@/lib/db/mongodb");
  await connectDB();
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

beforeEach(async () => {
  await CaiAutorizacionModel.deleteMany({});
});

function crearCaiFixture(overrides: Partial<{
  cai: string;
  estado: "activo" | "cancelado";
  fechaVencimiento: Date;
  puntoVenta: number;
  numeroDesde: number;
  numeroHasta: number;
  proximoNumero: number;
  fechaAutorizacion: Date;
}> = {}) {
  const {
    cai = "11111111111111",
    estado = "activo",
    fechaVencimiento = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
    fechaAutorizacion = new Date(),
    puntoVenta = 13,
    numeroDesde = 1,
    numeroHasta = 10,
    proximoNumero = numeroDesde,
  } = overrides;

  return CaiAutorizacionModel.create({
    cai,
    cuit: "30693787285",
    contribuyente: "Fixture S.A.",
    fechaAutorizacion,
    fechaVencimiento,
    estado,
    puntos: [
      {
        puntoVenta,
        domicilio: "Domicilio de prueba",
        tipoComprobante: 91,
        numeroDesde,
        numeroHasta,
        proximoNumero,
      },
    ],
  });
}

describe("obtenerProximoNumeroRemito", () => {
  it("asigna el primer número disponible y lo incrementa", async () => {
    await crearCaiFixture({ cai: "AAA", numeroDesde: 100, numeroHasta: 110 });

    const primero = await obtenerProximoNumeroRemito(13);
    expect(primero.numero).toBe(100);
    expect(primero.cai).toBe("AAA");

    const segundo = await obtenerProximoNumeroRemito(13);
    expect(segundo.numero).toBe(101);
  });

  it("lanza error claro si no hay CAI para el punto de venta pedido", async () => {
    await crearCaiFixture({ puntoVenta: 13 });

    await expect(obtenerProximoNumeroRemito(999)).rejects.toThrow(
      /No hay CAI vigente con numeraci.*punto de venta 999/
    );
  });

  it("no asigna números fuera del rango cuando el punto está agotado", async () => {
    await crearCaiFixture({ cai: "BBB", numeroDesde: 1, numeroHasta: 2, proximoNumero: 1 });

    const uno = await obtenerProximoNumeroRemito(13);
    const dos = await obtenerProximoNumeroRemito(13);
    expect([uno.numero, dos.numero]).toEqual([1, 2]);

    await expect(obtenerProximoNumeroRemito(13)).rejects.toThrow(/No hay CAI vigente/);
  });

  it("ignora un CAI vencido aunque tenga números disponibles", async () => {
    await crearCaiFixture({
      cai: "VENCIDO",
      fechaVencimiento: new Date(Date.now() - 24 * 60 * 60 * 1000),
      numeroDesde: 1,
      numeroHasta: 100,
    });

    await expect(obtenerProximoNumeroRemito(13)).rejects.toThrow(/No hay CAI vigente/);
  });

  it("ignora un CAI cancelado aunque tenga números disponibles", async () => {
    await crearCaiFixture({ cai: "CANCELADO", estado: "cancelado", numeroDesde: 1, numeroHasta: 100 });

    await expect(obtenerProximoNumeroRemito(13)).rejects.toThrow(/No hay CAI vigente/);
  });

  it("usa el CAI más antiguo primero y pasa al siguiente cuando se agota", async () => {
    await crearCaiFixture({
      cai: "VIEJO",
      numeroDesde: 1,
      numeroHasta: 1,
      fechaAutorizacion: new Date("2020-01-01"),
    });
    await crearCaiFixture({
      cai: "NUEVO",
      numeroDesde: 500,
      numeroHasta: 510,
      fechaAutorizacion: new Date("2024-01-01"),
    });

    const primero = await obtenerProximoNumeroRemito(13);
    expect(primero).toMatchObject({ numero: 1, cai: "VIEJO" });

    const segundo = await obtenerProximoNumeroRemito(13);
    expect(segundo).toMatchObject({ numero: 500, cai: "NUEVO" });
  });

  it("mantiene rangos independientes por punto de venta y por tipo de comprobante", async () => {
    await CaiAutorizacionModel.create({
      cai: "MULTI",
      cuit: "30693787285",
      fechaAutorizacion: new Date(),
      fechaVencimiento: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
      estado: "activo",
      puntos: [
        { puntoVenta: 12, domicilio: "A", tipoComprobante: 91, numeroDesde: 1, numeroHasta: 5, proximoNumero: 1 },
        { puntoVenta: 13, domicilio: "B", tipoComprobante: 91, numeroDesde: 900, numeroHasta: 905, proximoNumero: 900 },
      ],
    });

    const punto12 = await obtenerProximoNumeroRemito(12);
    const punto13 = await obtenerProximoNumeroRemito(13);

    expect(punto12.numero).toBe(1);
    expect(punto13.numero).toBe(900);
  });

  it("no asigna el mismo número dos veces bajo pedidos concurrentes (condición de carrera)", async () => {
    await crearCaiFixture({ cai: "CONCURRENCIA", numeroDesde: 1, numeroHasta: 20 });

    const resultados = await Promise.all(
      Array.from({ length: 20 }, () => obtenerProximoNumeroRemito(13))
    );

    const numeros = resultados.map((r) => r.numero).sort((a, b) => a - b);
    expect(numeros).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));

    await expect(obtenerProximoNumeroRemito(13)).rejects.toThrow(/No hay CAI vigente/);
  });
});
