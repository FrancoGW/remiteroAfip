import { NextRequest, NextResponse } from "next/server";
import { parseConstanciaCai } from "@/lib/cai/parseConstanciaCai";

/**
 * POST /api/cai/parse-pdf
 * Recibe la constancia de CAI (PDF) y devuelve los datos interpretados para
 * previsualización. NO persiste nada: el alta real se hace vía POST /api/cai
 * una vez que el usuario revisó/corrigió los datos en el formulario.
 *
 * @body multipart/form-data con campo "file"
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: "Debe adjuntar el PDF de la constancia de CAI en el campo 'file'" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const resultado = await parseConstanciaCai(buffer);

    return NextResponse.json({
      success: true,
      ...resultado,
      revisar: resultado.camposNoInterpretados.length > 0,
    });
  } catch (error: any) {
    console.error("Error parseando constancia de CAI:", error);
    return NextResponse.json(
      {
        success: false,
        error:
          error.message ||
          "No se pudo leer el PDF. Verifique que sea la constancia de CAI original (no escaneada) y vuelva a intentar.",
      },
      { status: 500 }
    );
  }
}
