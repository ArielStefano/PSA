// netlify/functions/guardarRegistro.js
const { google } = require("googleapis");

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: "Method not allowed",
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");

    const {
      fileName,
      pdfBase64,
      cliente,
      numeroEquipo,
      fecha,
      ubicacion,
      km,
      horasGenerales,
      horasEspecificas,
      detalles,
    } = body;

    if (!pdfBase64) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Falta pdfBase64 en el cuerpo" }),
      };
    }

    // ==== 1) Autenticación con Google ====
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = (process.env.GOOGLE_PRIVATE_KEY || "").replace(/\\n/g, "\n");
    const sheetId = process.env.GOOGLE_SHEET_ID;
    const driveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    const jwtClient = new google.auth.JWT(
      serviceAccountEmail,
      null,
      privateKey,
      [
        "https://www.googleapis.com/auth/drive.file",
        "https://www.googleapis.com/auth/spreadsheets",
      ]
    );

    await jwtClient.authorize();

    const drive = google.drive({ version: "v3", auth: jwtClient });
    const sheets = google.sheets({ version: "v4", auth: jwtClient });

    // ==== 2) Subir el PDF a Google Drive ====
    const pdfBuffer = Buffer.from(pdfBase64, "base64");

    const driveResponse = await drive.files.create({
      requestBody: {
        name: fileName || `hoja-registro-${numeroEquipo || "sin-equipo"}.pdf`,
        mimeType: "application/pdf",
        parents: driveFolderId ? [driveFolderId] : undefined,
      },
      media: {
        mimeType: "application/pdf",
        body: BufferToStream(pdfBuffer),
      },
      fields: "id, webViewLink, webContentLink",
    });

    const fileId = driveResponse.data.id;

    // Hacer el archivo visible (por enlace) si quieres compartir el link
    await drive.permissions.create({
      fileId,
      requestBody: {
        role: "reader",
        type: "anyone",
      },
    });

    // Obtener el link de visualización
    const fileLink = `https://drive.google.com/file/d/${fileId}/view`;

    // ==== 3) Añadir una fila a Google Sheets con el link ====
    // Puedes ajustar las columnas a tu gusto
    const row = [
      new Date().toISOString(), // timestamp
      fecha || "",
      cliente || "",
      numeroEquipo || "",
      ubicacion || "",
      km || "",
      horasGenerales || "",
      horasEspecificas || "",
      detalles || "",
      fileLink,
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "A1", // la hoja principal (A1 hace que se agregue al final)
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [row],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ ok: true, fileId, fileLink }),
    };
  } catch (err) {
    console.error("Error en guardarRegistro:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Error procesando el registro" }),
    };
  }
};

// Utilidad para convertir Buffer a stream (necesario para drive.media.body)
const { Readable } = require("stream");
function BufferToStream(binary) {
  const readable = new Readable();
  readable._read = () => {};
  readable.push(binary);
  readable.push(null);
  return readable;
}
