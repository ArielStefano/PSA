import React, { useState, useRef, useEffect, useMemo } from "react";
import { jsPDF } from "jspdf";

/** ======================
 *  CONFIG WHATSAPP
 *  ====================== */
const SUPPORT_PHONE = "593958897066"; // sin "+"
const SUPPORT_DEFAULT_MESSAGE =
  "Hola, necesito soporte con un reporte generado en CONTROL HORAS Y KM (ASTAP).";

/** ======================
 *  LOGO PDF (opcional)
 *  ====================== */
const ASTAP_LOGO_BASE64 = null;

/* ====================== PDF HELPERS ====================== */

const createDoc = () =>
  new jsPDF({ orientation: "l", unit: "mm", format: "a4", compress: true });

// Detecta el formato real desde el dataURL
const detectImageFormat = (dataUrl) => {
  if (!dataUrl || typeof dataUrl !== "string") return "PNG";
  if (
    dataUrl.startsWith("data:image/jpeg") ||
    dataUrl.startsWith("data:image/jpg")
  )
    return "JPEG";
  if (dataUrl.startsWith("data:image/png")) return "PNG";
  return "PNG";
};

const addFittedImage = (doc, dataUrl, x, y, boxW, boxH) => {
  if (!dataUrl) return;
  const format = detectImageFormat(dataUrl);
  const props = doc.getImageProperties(dataUrl);
  const ratio = Math.min(boxW / props.width, boxH / props.height);
  const w = props.width * ratio;
  const h = props.height * ratio;
  const offsetX = x + (boxW - w) / 2;
  const offsetY = y + (boxH - h) / 2;
  doc.addImage(dataUrl, format, offsetX, offsetY, w, h, undefined, "FAST");
};

const drawSectionHeader = (doc, text, y, pageWidth, margin) => {
  const blue = { r: 0, g: 51, b: 102 };
  doc.setFillColor(blue.r, blue.g, blue.b);
  doc.rect(margin, y, pageWidth - margin * 2, 7, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(text, margin + 2, y + 4.8);
  doc.setTextColor(0, 0, 0);
};

const drawTopHeader = (
  doc,
  pageWidth,
  margin,
  subtitle = "HOJA DE REGISTRO DE HORAS Y KILOMETRAJES EQUIPOS HIDROSUCCIONADORES"
) => {
  const blue = { r: 0, g: 51, b: 102 };
  doc.setFillColor(blue.r, blue.g, blue.b);
  doc.rect(0, 0, pageWidth, 18, "F");

  if (ASTAP_LOGO_BASE64) {
    addFittedImage(doc, ASTAP_LOGO_BASE64, margin, 3, 20, 12);
  } else {
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("ASTAP", margin, 12);
  }

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text(subtitle, pageWidth / 2, 11, { align: "center" });

  doc.setTextColor(0, 0, 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
};

const buildPdf = (doc, data) => {
  const {
    numeroEquipo,
    ubicacion,
    clienteInspeccion,
    km,
    horasGenerales,
    horasEspecificas,
    detalles,
    fechaStr,
    responsableEquipo,
    imagenChasisUrl,
    imagenesUrls = [],
    firmaDataUrl,
  } = data;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 10;

  const imagenPrincipalDetalles =
    imagenesUrls.length > 0 ? imagenesUrls[0] : null;
  const imagenesRestantes =
    imagenesUrls.length > 1 ? imagenesUrls.slice(1) : [];

  drawTopHeader(doc, pageWidth, margin);
  let y = 22;

  // DATOS GENERALES
  drawSectionHeader(doc, "DATOS GENERALES", y, pageWidth, margin);
  y += 9;

  const columnMid = pageWidth / 2;

  let leftY = y + 3;
  doc.text(`Cliente: ${clienteInspeccion || ""}`, margin + 2, leftY);
  leftY += 5;
  doc.text(`Responsable equipo: ${responsableEquipo || ""}`, margin + 2, leftY);
  leftY += 5;
  doc.text(`N° equipo: ${numeroEquipo || ""}`, margin + 2, leftY);

  let rightY = y + 3;
  doc.text(`Fecha: ${fechaStr || ""}`, columnMid + 2, rightY);
  rightY += 5;
  doc.text(`Ubicación: ${ubicacion || ""}`, columnMid + 2, rightY);

  y = Math.max(leftY, rightY) + 8;

  // CHASIS
  drawSectionHeader(doc, "CHASIS", y, pageWidth, margin);
  y += 9;

  const chasisBoxHeight = 40;
  const chasisTextWidth = (pageWidth - margin * 2) * 0.5 - 2;
  const chasisImgWidth = (pageWidth - margin * 2) * 0.5 - 2;

  doc.setDrawColor(0);
  doc.rect(margin, y, chasisTextWidth, chasisBoxHeight);
  doc.setFont("helvetica", "bold");
  doc.text("Kilómetros:", margin + 2, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text((km || "").toString(), margin + 2, y + 10, {
    maxWidth: chasisTextWidth - 4,
  });

  const imgX = margin + chasisTextWidth + 4;
  doc.setFont("helvetica", "bold");
  doc.text("Imagen chasis:", imgX, y + 5);
  doc.rect(imgX, y + 7, chasisImgWidth, chasisBoxHeight - 7);
  if (imagenChasisUrl) {
    addFittedImage(
      doc,
      imagenChasisUrl,
      imgX,
      y + 7,
      chasisImgWidth,
      chasisBoxHeight - 7
    );
  }

  y += chasisBoxHeight + 10;

  // HORAS
  drawSectionHeader(doc, "HORAS", y, pageWidth, margin);
  y += 9;

  const horasBoxHeight = 20;
  const horasBoxWidth = (pageWidth - margin * 2 - 4) / 2;

  doc.rect(margin, y, horasBoxWidth, horasBoxHeight);
  doc.setFont("helvetica", "bold");
  doc.text("Generales:", margin + 2, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text((horasGenerales || "").toString(), margin + 2, y + 10, {
    maxWidth: horasBoxWidth - 4,
  });

  const horasEspX = margin + horasBoxWidth + 4;
  doc.rect(horasEspX, y, horasBoxWidth, horasBoxHeight);
  doc.setFont("helvetica", "bold");
  doc.text("Específicas:", horasEspX + 2, y + 5);
  doc.setFont("helvetica", "normal");
  doc.text((horasEspecificas || "").toString(), horasEspX + 2, y + 10, {
    maxWidth: horasBoxWidth - 4,
  });

  y += horasBoxHeight + 10;

  // DETALLES + FOTO
  drawSectionHeader(doc, "DETALLES", y, pageWidth, margin);
  y += 9;

  const detallesBoxHeight = 30;
  const totalDetallesWidth = pageWidth - margin * 2;
  const detallesTextWidth = totalDetallesWidth * 0.6;
  const detallesImgWidth = totalDetallesWidth - detallesTextWidth - 4;

  doc.rect(margin, y, detallesTextWidth, detallesBoxHeight);
  doc.setFont("helvetica", "normal");
  doc.text((detalles || "").toString(), margin + 2, y + 5, {
    maxWidth: detallesTextWidth - 4,
  });

  const detallesImgX = margin + detallesTextWidth + 4;
  doc.rect(detallesImgX, y, detallesImgWidth, detallesBoxHeight);
  if (imagenPrincipalDetalles) {
    addFittedImage(
      doc,
      imagenPrincipalDetalles,
      detallesImgX,
      y,
      detallesImgWidth,
      detallesBoxHeight
    );
  }

  y += detallesBoxHeight + 10;

  // FOTOS DEL EQUIPO (multi página)
  if (imagenesRestantes.length > 0) {
    drawSectionHeader(doc, "FOTOS DEL EQUIPO", y, pageWidth, margin);
    y += 9;

    const fotosBoxW = (pageWidth - margin * 2 - 6) / 3;
    const fotosBoxH = 35;
    let fotoX = margin;
    let fotoY = y;
    let lastRowBottom = y;
    const maxFotosY = pageHeight - margin - 10;

    imagenesRestantes.forEach((url, index) => {
      if (fotoY + fotosBoxH > maxFotosY) {
        doc.addPage();
        drawTopHeader(doc, pageWidth, margin);
        let y2 = 22;
        drawSectionHeader(
          doc,
          "FOTOS DEL EQUIPO (CONTINUACIÓN)",
          y2,
          pageWidth,
          margin
        );
        y2 += 9;
        fotoX = margin;
        fotoY = y2;
      }

      doc.rect(fotoX, fotoY, fotosBoxW, fotosBoxH);
      addFittedImage(doc, url, fotoX, fotoY, fotosBoxW, fotosBoxH);

      lastRowBottom = fotoY + fotosBoxH;

      if ((index + 1) % 3 === 0) {
        fotoX = margin;
        fotoY += fotosBoxH + 3;
      } else {
        fotoX += fotosBoxW + 3;
      }
    });

    y = lastRowBottom + 10;
  }

  // FIRMAS
  const firmaBoxH = 25;
  const firmasEstimated = 9 + 7 + firmaBoxH + 15;
  if (y + firmasEstimated > pageHeight - margin) {
    doc.addPage();
    drawTopHeader(doc, pageWidth, margin);
    y = 22;
  }

  drawSectionHeader(doc, "FIRMAS", y, pageWidth, margin);
  y += 9;

  const firmaBoxW = 60;
  doc.setFont("helvetica", "bold");
  doc.text("Responsable equipo:", margin + 2, y + 5);
  doc.rect(margin, y + 7, firmaBoxW, firmaBoxH);
  if (firmaDataUrl) addFittedImage(doc, firmaDataUrl, margin, y + 7, firmaBoxW, firmaBoxH);
  doc.setFont("helvetica", "normal");
  doc.text(responsableEquipo || "", margin, y + 7 + firmaBoxH + 5);
};

/* ====================== IMAGE COMPRESSION ====================== */

const compressImageFileToDataUrl = (file, { maxDim = 1280, quality = 0.75 } = {}) =>
  new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const scale = Math.min(1, maxDim / Math.max(w, h));
      const nw = Math.round(w * scale);
      const nh = Math.round(h * scale);

      const canvas = document.createElement("canvas");
      canvas.width = nw;
      canvas.height = nh;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, nw, nh);

      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      URL.revokeObjectURL(url);
      resolve(dataUrl);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result);
      fr.readAsDataURL(file);
    };
    img.src = url;
  });

/* ====================== WHATSAPP ====================== */

const buildWhatsAppLink = (phone, message) => {
  const text = encodeURIComponent(message || "");
  const cleanPhone = (phone || "").replace(/\D/g, "");
  if (cleanPhone) return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${text}`;
  return `https://api.whatsapp.com/send?text=${text}`;
};

const HojaRegistroHoras = () => {
  const [responsableEquipo, setResponsableEquipo] = useState("");
  const [imagenChasisUrl, setImagenChasisUrl] = useState(null);
  const [imagenesUrls, setImagenesUrls] = useState([]);

  const [vista, setVista] = useState("list");
  const [registros, setRegistros] = useState([]);

  const [waOpen, setWaOpen] = useState(false);

  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewName, setPreviewName] = useState("");

  const [dia, setDia] = useState(() => String(new Date().getDate()).padStart(2, "0"));
  const [mes, setMes] = useState(() => String(new Date().getMonth() + 1).padStart(2, "0"));
  const [anio, setAnio] = useState(() => String(new Date().getFullYear()));

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("registrosHrsKm");
      if (stored) setRegistros(JSON.parse(stored));
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const guardarRegistroLocal = (registro) => {
    setRegistros((prev) => {
      const updated = [...prev, registro];
      try {
        localStorage.setItem("registrosHrsKm", JSON.stringify(updated));
      } catch (err) {
        alert("⚠️ No se pudo guardar (límite de almacenamiento). Reduce fotos o calidad.");
      }
      return updated;
    });
  };

  const buildReportMessage = (r) => {
    return [
      "📄 *REPORTE ASTAP – CONTROL HORAS Y KM*",
      "",
      `📅 *Fecha:* ${r.fechaStr || "-"}`,
      `🏢 *Cliente:* ${r.clienteInspeccion || "-"}`,
      `🧰 *Equipo:* ${r.numeroEquipo || "-"}`,
      `📍 *Ubicación:* ${r.ubicacion || "-"}`,
      "",
      "Adjunto el PDF del reporte.",
      "Por favor confirmar recepción.",
    ].join("\n");
  };

  const generarPdfBlob = (registro) => {
    const doc = createDoc();
    buildPdf(doc, registro);
    return doc.output("blob");
  };

  const verPdfDesdeRegistro = (registro) => {
    try {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const blob = generarPdfBlob(registro);
      const url = URL.createObjectURL(blob);

      const name = registro.numeroEquipo?.trim()
        ? `hoja-registro-${registro.numeroEquipo}.pdf`
        : "hoja-registro.pdf";

      setPreviewUrl(url);
      setPreviewName(name);

      // Abrir visor nativo
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      console.error(e);
      alert("No se pudo abrir el PDF.");
    }
  };

  const descargarPdfDesdeRegistro = (registro) => {
    const doc = createDoc();
    buildPdf(doc, registro);
    const nombreArchivo = registro.numeroEquipo?.trim()
      ? `hoja-registro-${registro.numeroEquipo}.pdf`
      : "hoja-registro.pdf";
    doc.save(nombreArchivo);
  };

  const enviarPdfPorWhatsApp = async (registro) => {
    const fileName = registro.numeroEquipo?.trim()
      ? `hoja-registro-${registro.numeroEquipo}.pdf`
      : "hoja-registro.pdf";

    const blob = generarPdfBlob(registro);

    // 1) móvil: share nativo (archivo completo)
    try {
      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: "application/pdf" });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            files: [file],
            title: "Reporte ASTAP",
            text: buildReportMessage(registro),
          });
          return;
        }
      }
    } catch (e) {
      console.warn("Share falló:", e);
    }

    // 2) desktop: abrir chat + descargar para adjuntar manual
    const msg =
      buildReportMessage(registro) +
      "\n\n⚠️ *En PC:* WhatsApp Web no permite adjuntar este PDF automáticamente.\n" +
      "1) Descarga el PDF\n2) Adjunta el archivo manualmente en el chat.";

    const waUrl = buildWhatsAppLink(SUPPORT_PHONE, msg);
    const win = window.open(waUrl, "_blank", "noopener,noreferrer");

    if (!win) {
      try {
        await navigator.clipboard.writeText(msg);
        alert(
          "Tu navegador bloqueó la ventana de WhatsApp.\n\n" +
            "✅ Copié el mensaje al portapapeles.\n" +
            "Abre WhatsApp y pégalo. Luego adjunta el PDF descargado."
        );
      } catch {
        alert(
          "Tu navegador bloqueó la ventana de WhatsApp.\n" +
            "Abre WhatsApp manualmente y envía el reporte. Luego adjunta el PDF descargado."
        );
      }
    }

    descargarPdfDesdeRegistro(registro);
  };

  /* ====== FIRMA ====== */
  const getCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const t = e.touches?.[0];
    const clientX = t ? t.clientX : e.clientX;
    const clientY = t ? t.clientY : e.clientY;
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const startDrawing = (e) => {
    if (e.touches) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoords(e, canvas);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    if (e.touches) e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoords(e, canvas);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e?.touches) e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
  };

  /* ====== IMÁGENES ====== */
  const handleImagenChasisChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setImagenChasisUrl(null);
      return;
    }
    const dataUrl = await compressImageFileToDataUrl(file, {
      maxDim: 1280,
      quality: 0.75,
    });
    setImagenChasisUrl(dataUrl);
    e.target.value = "";
  };

  const handleImagenesChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const compressed = await Promise.all(
      files.map((f) => compressImageFileToDataUrl(f, { maxDim: 1280, quality: 0.75 }))
    );
    setImagenesUrls((prev) => [...prev, ...compressed]);
    e.target.value = "";
  };

  const imageBoxStyle = {
    width: "190px",
    height: "190px",
    objectFit: "contain",
    border: "1px solid #000",
    backgroundColor: "#fff",
  };

  const dataInputClass = "flex-1 px-2 py-1 outline-none text-blue-600";
  const dataTextAreaClass = "flex-1 px-2 py-1 outline-none resize-none text-blue-600";

  // Guardar (sin descargar)
  const handleGuardarRegistro = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);

    const numeroEquipo = formData.get("numeroEquipo") || "";
    const ubicacion = formData.get("ubicacion") || "";
    const clienteInspeccion = formData.get("clienteInspeccion") || "";
    const km = formData.get("kilometros") || "";
    const horasGenerales = formData.get("horasGenerales") || "";
    const horasEspecificas = formData.get("horasEspecificas") || "";
    const detalles = formData.get("detalles") || "";
    const fechaStr = `${dia}/${mes}/${anio}`;

    let firmaDataUrl = null;
    if (canvasRef.current) firmaDataUrl = canvasRef.current.toDataURL("image/png");

    const data = {
      numeroEquipo,
      ubicacion,
      clienteInspeccion,
      km,
      horasGenerales,
      horasEspecificas,
      detalles,
      fechaStr,
      responsableEquipo,
      imagenChasisUrl,
      imagenesUrls,
      firmaDataUrl,
    };

    guardarRegistroLocal({ id: Date.now(), ...data });
    setVista("list");
  };

  const soporteLink = buildWhatsAppLink(SUPPORT_PHONE, SUPPORT_DEFAULT_MESSAGE);

  const fabStyle = useMemo(() => {
    const baseBottom = vista === "form" ? 120 : 16;
    return {
      right: "16px",
      bottom: `calc(${baseBottom}px + env(safe-area-inset-bottom))`,
    };
  }, [vista]);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-start p-4 gap-6">
      {/* WHATSAPP FAB */}
      <div className="fixed z-50" style={fabStyle}>
        {waOpen && (
          <div className="mb-2 w-60 rounded-lg bg-white shadow-lg border border-slate-200 overflow-hidden">
            <div className="px-3 py-2 text-[12px] font-semibold bg-slate-50 border-b border-slate-200">
              WhatsApp
            </div>
            <div className="p-2 flex flex-col gap-2">
              <a
                href={soporteLink}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-2 rounded bg-green-600 text-white text-xs font-semibold hover:bg-green-700"
              >
                Abrir chat de soporte
              </a>
              <button
                type="button"
                onClick={() => setWaOpen(false)}
                className="px-3 py-2 rounded border text-xs hover:bg-slate-50"
              >
                Cerrar
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => setWaOpen((v) => !v)}
          className="w-12 h-12 rounded-full bg-green-600 text-white font-bold shadow-lg hover:bg-green-700 flex items-center justify-center"
          title="WhatsApp"
        >
          WA
        </button>
      </div>

      {/* LISTADO */}
      {vista === "list" && (
        <div className="w-full max-w-5xl bg-white border border-slate-300 rounded p-3 text-[11px] md:text-xs">
          <div className="flex justify-between items-center mb-3">
            <h1 className="font-bold text-sm md:text-base">Registros de horas y kilometrajes</h1>
            <button
              type="button"
              onClick={() => setVista("form")}
              className="px-3 py-1 text-xs md:text-sm border border-blue-600 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
            >
              Nuevo reporte
            </button>
          </div>

          {registros.length === 0 ? (
            <p className="text-[11px] text-slate-500">No hay registros guardados en este navegador.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full border text-[11px]">
                  <thead>
                    <tr className="bg-slate-100">
                      <th className="border px-2 py-1">#</th>
                      <th className="border px-2 py-1">Fecha</th>
                      <th className="border px-2 py-1">Cliente</th>
                      <th className="border px-2 py-1">Equipo</th>
                      <th className="border px-2 py-1">Ubicación</th>
                      <th className="border px-2 py-1">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registros.map((r, idx) => (
                      <tr key={r.id || idx}>
                        <td className="border px-2 py-1 text-center">{idx + 1}</td>
                        <td className="border px-2 py-1 text-center">{r.fechaStr}</td>
                        <td className="border px-2 py-1">{r.clienteInspeccion}</td>
                        <td className="border px-2 py-1 text-center">{r.numeroEquipo}</td>
                        <td className="border px-2 py-1">{r.ubicacion}</td>
                        <td className="border px-2 py-1">
                          <div className="flex gap-2 justify-center flex-wrap">
                            <button
                              type="button"
                              onClick={() => verPdfDesdeRegistro(r)}
                              className="px-2 py-1 border border-slate-600 rounded text-[10px] text-slate-700 hover:bg-slate-50"
                            >
                              Ver PDF
                            </button>
                            <button
                              type="button"
                              onClick={() => descargarPdfDesdeRegistro(r)}
                              className="px-2 py-1 border border-blue-600 rounded text-[10px] text-blue-600 hover:bg-blue-50"
                            >
                              Descargar PDF
                            </button>

                            {/* ✅ Solo celular + tablet (se oculta en PC) */}
                            <button
                              type="button"
                              onClick={() => enviarPdfPorWhatsApp(r)}
                              className="px-2 py-1 border border-green-600 rounded text-[10px] text-green-700 hover:bg-green-50 lg:hidden"
                            >
                              Enviar WhatsApp
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="mt-2 text-[10px] text-slate-500">
                * Estos registros se guardan en este navegador (localStorage).
              </p>

              {previewUrl && (
                <div className="mt-3 text-[11px] text-slate-700">
                  Último PDF generado:{" "}
                  <a
                    href={previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 underline"
                  >
                    {previewName || "Abrir"}
                  </a>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* FORM */}
      {vista === "form" && (
        <>
          <div className="w-full max-w-5xl flex justify-between items-center mb-2">
            <button
              type="button"
              onClick={() => setVista("list")}
              className="px-3 py-1 text-xs md:text-sm border border-slate-400 rounded bg-white hover:bg-slate-100"
            >
              ← Volver al listado
            </button>
            <span className="text-[11px] md:text-xs text-slate-600">Llenando nuevo reporte</span>
          </div>

          <form onSubmit={handleGuardarRegistro} className="w-full max-w-5xl text-[11px] md:text-xs">
            <div className="bg-white border-4 border-blue-600 w-full">
              <div className="flex border-b border-black">
                <div className="w-28 md:w-32 border-r border-black flex items-center justify-center p-2">
                  <span className="font-bold text-lg uppercase">ASTAP</span>
                </div>
                <div className="flex-1 flex items-center justify-center px-2">
                  <h1 className="text-center font-bold uppercase leading-tight">
                    Hoja de registro de horas y kilometrajes equipos hidrosuccionadores
                  </h1>
                </div>
              </div>

              <div className="flex border-b border-black">
                <div className="flex-1 border-r border-black">
                  <div className="flex">
                    <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase leading-tight text-[10px] md:text-[11px]">
                      Número de equipo
                      <span className="block normal-case text-[9px]">(en caso de aplicar):</span>
                    </label>
                    <input className={dataInputClass} name="numeroEquipo" type="text" />
                  </div>
                </div>
              </div>

              <div className="border-b border-black grid grid-cols-1 md:grid-cols-2">
                <div className="border-b md:border-b-0 md:border-r border-black">
                  <div className="flex">
                    <label className="w-32 md:w-40 border-r border-black px-2 py-1 font-semibold uppercase text-[10px] md:text-[11px]">
                      Fecha:
                    </label>
                    <div className="flex-1 grid grid-cols-3">
                      <input
                        className="border-r border-black px-1 py-1 text-[10px] md:text-[11px] outline-none text-center text-blue-600"
                        value={dia}
                        onChange={(e) => setDia(e.target.value)}
                      />
                      <input
                        className="border-r border-black px-1 py-1 text-[10px] md:text-[11px] outline-none text-center text-blue-600"
                        value={mes}
                        onChange={(e) => setMes(e.target.value)}
                      />
                      <input
                        className="px-1 py-1 text-[10px] md:text-[11px] outline-none text-center text-blue-600"
                        value={anio}
                        onChange={(e) => setAnio(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex border-t border-black">
                    <label className="w-32 md:w-40 border-r border-black px-2 py-1 font-semibold uppercase text-[10px] md:text-[11px]">
                      Ubicación:
                    </label>
                    <input className={dataInputClass} name="ubicacion" type="text" />
                  </div>
                </div>

                <div>
                  <div className="border-b border-black flex">
                    <label className="w-32 border-r border-black px-2 py-1 font-semibold uppercase text-[10px] md:text-[11px]">
                      Cliente:
                    </label>
                    <input className={dataInputClass} name="clienteInspeccion" type="text" />
                  </div>

                  <div className="flex">
                    <label className="w-32 border-r border-black px-2 py-1 font-semibold uppercase leading-tight text-[10px] md:text-[11px]">
                      Responsable
                      <span className="block">equipo:</span>
                    </label>
                    <input
                      className={dataInputClass}
                      type="text"
                      value={responsableEquipo}
                      onChange={(e) => setResponsableEquipo(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="border-b border-black text-center py-1 font-semibold uppercase">Chasis</div>

              <div className="grid grid-cols-3 border-b border-black">
                <div className="col-span-2 flex">
                  <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
                    Kilómetros:
                  </label>
                  <textarea className={`${dataTextAreaClass} h-20`} name="kilometros" />
                </div>

                <div className="border-l border-black flex flex-col">
                  <div className="border-b border-black text-center py-1 font-semibold uppercase">
                    Imagen
                  </div>
                  <div className="flex-1 flex flex-col items-center justify-center px-1 text-center gap-1 py-1">
                    <span className="text-[10px]">Adjuntar imagen / foto del chasis</span>
                    <div className="flex flex-wrap gap-2">
                      <label className="px-2 py-1 border border-blue-600 rounded text-[10px] text-blue-600 hover:bg-blue-50 cursor-pointer">
                        Tomar foto
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={handleImagenChasisChange}
                        />
                      </label>
                      <label className="px-2 py-1 border border-slate-500 rounded text-[10px] text-slate-700 hover:bg-slate-100 cursor-pointer">
                        Cargar desde galería
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={handleImagenChasisChange}
                        />
                      </label>
                    </div>
                    {imagenChasisUrl && <img src={imagenChasisUrl} alt="Chasis" style={imageBoxStyle} />}
                  </div>
                </div>
              </div>

              <div className="border-b border-black text-center py-1 font-semibold uppercase">Módulo</div>

              <div className="flex border-b border-black">
                <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
                  Horas:<span className="normal-case"> (generales)</span>
                </label>
                <textarea className={`${dataTextAreaClass} h-16`} name="horasGenerales" />
              </div>

              <div className="flex border-b border-black">
                <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
                  Horas:<span className="normal-case"> (específicas)</span>
                </label>
                <textarea className={`${dataTextAreaClass} h-16`} name="horasEspecificas" />
              </div>

              <div className="flex border-b border-black">
                <div className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
                  Detalles:
                  <div className="normal-case text-[9px] mt-1 leading-tight">
                    (Espacio para ingresar novedades referentes al equipo, su operación o funcionamiento)
                  </div>
                </div>
                <textarea className={`${dataTextAreaClass} h-20`} name="detalles" />
              </div>

              <div className="flex border-b border-black">
                <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
                  Imágenes:
                </label>
                <div className="flex-1 flex flex-col px-2 py-1 gap-2">
                  <div className="flex flex-wrap gap-2">
                    <label className="px-2 py-1 border border-blue-600 rounded text-[10px] text-blue-600 hover:bg-blue-50 cursor-pointer">
                      Tomar foto
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={handleImagenesChange}
                      />
                    </label>
                    <label className="px-2 py-1 border border-slate-500 rounded text-[10px] text-slate-700 hover:bg-slate-100 cursor-pointer">
                      Cargar desde galería
                      <input
                        type="file"
                        multiple
                        accept="image/*"
                        className="hidden"
                        onChange={handleImagenesChange}
                      />
                    </label>
                  </div>

                  {imagenesUrls.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {imagenesUrls.map((url, idx) => (
                        <img key={idx} src={url} alt={`Imagen ${idx + 1}`} style={imageBoxStyle} />
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="border-b border-black px-4 py-3">
                <div className="border border-black h-24 flex flex-col">
                  <canvas
                    ref={canvasRef}
                    width={600}
                    height={90}
                    className="w-full h-full"
                    style={{ touchAction: "none" }}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                  />
                </div>
                <div className="flex justify-between items-center mt-1">
                  <p className="text-xs text-center flex-1 text-blue-600">
                    {responsableEquipo || "Nombre del responsable del equipo"}
                  </p>
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="ml-4 px-2 py-1 text-[10px] border border-slate-400 rounded hover:bg-slate-100"
                  >
                    Borrar firma
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between p-3">
              <button
                type="button"
                onClick={() => setVista("list")}
                className="px-3 py-2 text-xs md:text-sm border border-slate-400 rounded bg-white text-slate-700 hover:bg-slate-100"
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="px-4 py-2 text-xs md:text-sm border border-blue-600 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
              >
                Guardar reporte
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default HojaRegistroHoras;
