// src/components/HojaRegistroHoras.jsx
import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";

// Reemplaza null por tu dataURL base64 del logo, por ejemplo:
// const ASTAP_LOGO_BASE64 = "data:image/png;base64,AAAA....";
const ASTAP_LOGO_BASE64 = null;

const HojaRegistroHoras = () => {
  const [responsableEquipo, setResponsableEquipo] = useState("");
  const [imagenChasisUrl, setImagenChasisUrl] = useState(null);
  const [imagenesUrls, setImagenesUrls] = useState([]);

  // Fecha actual
  const [dia, setDia] = useState(() =>
    String(new Date().getDate()).padStart(2, "0")
  );
  const [mes, setMes] = useState(() =>
    String(new Date().getMonth() + 1).padStart(2, "0")
  );
  const [anio, setAnio] = useState(() =>
    String(new Date().getFullYear())
  );

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // ====== FIRMA: COORDENADAS CORREGIDAS PARA EL CANVAS ======
  const getCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoords(e, canvas);

    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000000";

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoords(e, canvas);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = (e) => {
    if (e) e.preventDefault();
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // ====== IMAGEN CHASIS (DATA URL) ======
  const handleImagenChasisChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setImagenChasisUrl(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImagenChasisUrl(reader.result); // dataURL
    };
    reader.readAsDataURL(file);
  };

  // ====== IMÁGENES GENERALES (MÚLTIPLES DATA URL) ======
  const handleImagenesChange = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) {
      setImagenesUrls([]);
      return;
    }

    const urls = [];
    let loaded = 0;

    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        urls.push(reader.result); // dataURL
        loaded += 1;
        if (loaded === files.length) {
          setImagenesUrls(urls);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // ~5x5 cm ≈ 190x190 px para la vista en pantalla
  const imageBoxStyle = {
    width: "190px",
    height: "190px",
    objectFit: "contain",
    border: "1px solid #000",
    backgroundColor: "#fff",
  };

  // Clases para datos en azul
  const dataInputClass = "flex-1 px-2 py-1 outline-none text-blue-600";
  const dataTextAreaClass =
    "flex-1 px-2 py-1 outline-none resize-none text-blue-600";

  // ====== UTILIDAD PARA IMÁGENES EN EL PDF ======
  const addFittedImage = (doc, dataUrl, x, y, boxW, boxH) => {
    if (!dataUrl) return;
    const props = doc.getImageProperties(dataUrl);
    const ratio = Math.min(boxW / props.width, boxH / props.height);
    const w = props.width * ratio;
    const h = props.height * ratio;
    const offsetX = x + (boxW - w) / 2;
    const offsetY = y + (boxH - h) / 2;
    doc.addImage(dataUrl, "PNG", offsetX, offsetY, w, h);
  };

  // ====== UTILIDAD PARA BARRAS DE SECCIÓN ======
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

  // ====== GENERAR PDF PROFESIONAL ======
  const handleGeneratePdf = async (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const numeroEquipo = formData.get("numeroEquipo") || "";
    const ubicacion = formData.get("ubicacion") || "";
    const clienteInspeccion = formData.get("clienteInspeccion") || "";
    const km = formData.get("kilometros") || "";
    const horasGenerales = formData.get("horasGenerales") || "";
    const horasEspecificas = formData.get("horasEspecificas") || "";
    const detalles = formData.get("detalles") || "";

    const fechaStr = `${dia}/${mes}/${anio}`;

    // Firma como imagen (dataURL)
    let firmaDataUrl = null;
    if (canvasRef.current) {
      firmaDataUrl = canvasRef.current.toDataURL("image/png");
    }

    // Crear PDF en horizontal
    const doc = new jsPDF("l", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 10;

    // ====== ENCABEZADO CON BARRA AZUL ======
    const blue = { r: 0, g: 51, b: 102 };
    doc.setFillColor(blue.r, blue.g, blue.b);
    doc.rect(0, 0, pageWidth, 18, "F");

    // Logo (si se configuró)
    if (ASTAP_LOGO_BASE64) {
      addFittedImage(doc, ASTAP_LOGO_BASE64, margin, 3, 20, 12);
    } else {
      // Texto ASTAP si no hay logo
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("ASTAP", margin, 12);
    }

    // Título centrado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(255, 255, 255);
    doc.text(
      "HOJA DE REGISTRO DE HORAS Y KILOMETRAJES EQUIPOS HIDROSUCCIONADORES",
      pageWidth / 2,
      11,
      { align: "center" }
    );

    // Volver a texto negro
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);

    let y = 22;

    // ====== DATOS GENERALES ======
    drawSectionHeader(doc, "DATOS GENERALES", y, pageWidth, margin);
    y += 9;

    const columnMid = pageWidth / 2;

    // Columna izquierda
    let leftY = y + 3;
    doc.text(`Cliente: ${clienteInspeccion}`, margin + 2, leftY);
    leftY += 5;
    doc.text(`Responsable equipo: ${responsableEquipo}`, margin + 2, leftY);
    leftY += 5;
    doc.text(`N° equipo: ${numeroEquipo}`, margin + 2, leftY);

    // Columna derecha
    let rightY = y + 3;
    doc.text(`Fecha: ${fechaStr}`, columnMid + 2, rightY);
    rightY += 5;
    doc.text(`Ubicación: ${ubicacion}`, columnMid + 2, rightY);

    y = Math.max(leftY, rightY) + 8;

    // ====== CHASIS ======
    drawSectionHeader(doc, "CHASIS", y, pageWidth, margin);
    y += 9;

    const chasisBoxHeight = 40;
    const chasisTextWidth = (pageWidth - margin * 2) * 0.5 - 2;
    const chasisImgWidth = (pageWidth - margin * 2) * 0.5 - 2;

    // Caja kilómetros (izquierda)
    doc.setDrawColor(0);
    doc.rect(margin, y, chasisTextWidth, chasisBoxHeight);
    doc.setFont("helvetica", "bold");
    doc.text("Kilómetros:", margin + 2, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(km.toString(), margin + 2, y + 10, {
      maxWidth: chasisTextWidth - 4,
    });

    // Caja imagen chasis (derecha)
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

    // ====== HORAS ======
    drawSectionHeader(doc, "HORAS", y, pageWidth, margin);
    y += 9;

    const horasBoxHeight = 20;
    const horasBoxWidth = (pageWidth - margin * 2 - 4) / 2;

    // Horas generales
    doc.setDrawColor(0);
    doc.rect(margin, y, horasBoxWidth, horasBoxHeight);
    doc.setFont("helvetica", "bold");
    doc.text("Generales:", margin + 2, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(horasGenerales.toString(), margin + 2, y + 10, {
      maxWidth: horasBoxWidth - 4,
    });

    // Horas específicas
    const horasEspX = margin + horasBoxWidth + 4;
    doc.setFont("helvetica", "bold");
    doc.rect(horasEspX, y, horasBoxWidth, horasBoxHeight);
    doc.text("Específicas:", horasEspX + 2, y + 5);
    doc.setFont("helvetica", "normal");
    doc.text(horasEspecificas.toString(), horasEspX + 2, y + 10, {
      maxWidth: horasBoxWidth - 4,
    });

    y += horasBoxHeight + 10;

    // ====== DETALLES ======
    drawSectionHeader(doc, "DETALLES", y, pageWidth, margin);
    y += 9;

    const detallesBoxHeight = 30;
    doc.rect(margin, y, pageWidth - margin * 2, detallesBoxHeight);
    doc.setFont("helvetica", "normal");
    doc.text(detalles.toString(), margin + 2, y + 5, {
      maxWidth: pageWidth - margin * 2 - 4,
    });

    y += detallesBoxHeight + 10;

    // ====== FOTOS DEL EQUIPO ======
    drawSectionHeader(doc, "FOTOS DEL EQUIPO", y, pageWidth, margin);
    y += 9;

    const fotosStartY = y;
    const fotosBoxW = (pageWidth - margin * 2 - 6) / 3; // 3 columnas
    const fotosBoxH = 35;

    let fotoX = margin;
    let fotoY = fotosStartY;
    let count = 0;

    // Usamos solo las imágenes adicionales (no re-usamos la del chasis aquí)
    imagenesUrls.slice(0, 6).forEach((url) => {
      doc.rect(fotoX, fotoY, fotosBoxW, fotosBoxH);
      addFittedImage(doc, url, fotoX, fotoY, fotosBoxW, fotosBoxH);

      fotoX += fotosBoxW + 3;
      count += 1;

      if (count % 3 === 0) {
        fotoX = margin;
        fotoY += fotosBoxH + 3;
      }
    });

    y = Math.max(fotoY + fotosBoxH, fotosStartY) + 10;

    // ====== FIRMAS ======
    drawSectionHeader(doc, "FIRMAS", y, pageWidth, margin);
    y += 9;

    const firmaBoxW = 60;
    const firmaBoxH = 25;

    doc.setFont("helvetica", "bold");
    doc.text("Responsable equipo:", margin + 2, y + 5);
    doc.rect(margin, y + 7, firmaBoxW, firmaBoxH);
    if (firmaDataUrl) {
      addFittedImage(doc, firmaDataUrl, margin, y + 7, firmaBoxW, firmaBoxH);
    }
    doc.setFont("helvetica", "normal");
    doc.text(
      responsableEquipo || "",
      margin,
      y + 7 + firmaBoxH + 5
    );

    doc.save("hoja-registro.pdf");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleGeneratePdf}
        className="w-full max-w-5xl text-[11px] md:text-xs"
      >
        {/* FORMULARIO VISUAL */}
        <div className="bg-white border-4 border-blue-600 w-full">
          {/* ENCABEZADO */}
          <div className="flex border-b border-black">
            <div className="w-28 md:w-32 border-r border-black flex items-center justify-center p-2">
              {/* Aquí puedes poner el logo real */}
              <span className="font-bold text-lg uppercase">ASTAP</span>
            </div>
            <div className="flex-1 flex items-center justify-center px-2">
              <h1 className="text-center font-bold uppercase leading-tight">
                Hoja de registro de horas y kilometrajes equipos hidrosuccionadores
              </h1>
            </div>
          </div>

          {/* NÚMERO DE EQUIPO */}
          <div className="flex border-b border-black">
            <div className="flex-1 border-r border-black">
              <div className="flex">
                <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase leading-tight">
                  Número de equipo
                  <span className="block normal-case text-[10px]">
                    (en caso de aplicar):
                  </span>
                </label>
                <input
                  className={dataInputClass}
                  name="numeroEquipo"
                  type="text"
                />
              </div>
            </div>
          </div>

          {/* FECHA / UBICACIÓN / CLIENTE / RESPONSABLE EQUIPO */}
          <div className="grid grid-cols-12 border-b border-black">
            <div className="col-span-6 border-r border-black">
              <div className="flex">
                <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
                  Fecha:
                </label>
                <div className="flex-1 grid grid-cols-3">
                  <input
                    className="border-r border-black px-2 py-1 outline-none text-center text-blue-600"
                    name="dia"
                    value={dia}
                    onChange={(e) => setDia(e.target.value)}
                  />
                  <input
                    className="border-r border-black px-2 py-1 outline-none text-center text-blue-600"
                    name="mes"
                    value={mes}
                    onChange={(e) => setMes(e.target.value)}
                  />
                  <input
                    className="px-2 py-1 outline-none text-center text-blue-600"
                    name="anio"
                    value={anio}
                    onChange={(e) => setAnio(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex border-t border-black">
                <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
                  Ubicación:
                </label>
                <input
                  className={dataInputClass}
                  name="ubicacion"
                  type="text"
                />
              </div>
            </div>

            <div className="col-span-6">
              <div className="border-b border-black flex">
                <label className="w-32 border-r border-black px-2 py-1 font-semibold uppercase">
                  Cliente:
                </label>
                <input
                  className={dataInputClass}
                  name="clienteInspeccion"
                  type="text"
                />
              </div>
              <div className="flex">
                <label className="w-32 border-r border-black px-2 py-1 font-semibold uppercase leading-tight">
                  Responsable
                  <span className="block">equipo:</span>
                </label>
                <input
                  className={dataInputClass}
                  name="responsableEquipo"
                  type="text"
                  value={responsableEquipo}
                  onChange={(e) => setResponsableEquipo(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* CHASIS */}
          <div className="border-b border-black text-center py-1 font-semibold uppercase">
            Chasis
          </div>

          {/* KILÓMETROS + IMAGEN CHASIS */}
          <div className="grid grid-cols-3 border-b border-black">
            <div className="col-span-2 flex">
              <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
                Kilómetros:
              </label>
              <textarea
                className={`${dataTextAreaClass} h-20`}
                name="kilometros"
              />
            </div>

            <div className="border-l border-black flex flex-col">
              <div className="border-b border-black text-center py-1 font-semibold uppercase">
                Imagen
              </div>
              <div className="flex-1 flex flex-col items-center justify-center px-1 text-center gap-1 py-1">
                <span className="text-[10px]">
                  Adjuntar imagen / foto del chasis
                </span>
                <input
                  type="file"
                  name="imagenChasis"
                  accept="image/*"
                  className="text-[10px]"
                  onChange={handleImagenChasisChange}
                />
                {imagenChasisUrl && (
                  <img
                    src={imagenChasisUrl}
                    alt="Chasis"
                    style={imageBoxStyle}
                  />
                )}
              </div>
            </div>
          </div>

          {/* MÓDULO */}
          <div className="border-b border-black text-center py-1 font-semibold uppercase">
            Módulo
          </div>

          {/* HORAS GENERALES */}
          <div className="flex border-b border-black">
            <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
              Horas:
              <span className="normal-case"> (generales)</span>
            </label>
            <textarea
              className={`${dataTextAreaClass} h-16`}
              name="horasGenerales"
            />
          </div>

          {/* HORAS ESPECÍFICAS */}
          <div className="flex border-b border-black">
            <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
              Horas:
              <span className="normal-case"> (específicas)</span>
            </label>
            <textarea
              className={`${dataTextAreaClass} h-16`}
              name="horasEspecificas"
            />
          </div>

          {/* DETALLES */}
          <div className="flex border-b border-black">
            <div className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
              Detalles:
              <div className="normal-case text-[9px] mt-1 leading-tight">
                (Espacio para ingresar novedades referentes al equipo, su operación
                o funcionamiento)
              </div>
            </div>
            <textarea
              className={`${dataTextAreaClass} h-20`}
              name="detalles"
            />
          </div>

          {/* IMÁGENES GENERALES CON PREVIEW */}
          <div className="flex border-b border-black">
            <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
              Imágenes:
            </label>
            <div className="flex-1 flex flex-col px-2 py-1 gap-2">
              <input
                type="file"
                multiple
                className="text-[10px]"
                name="imagenes"
                onChange={handleImagenesChange}
                accept="image/*"
              />
              {imagenesUrls.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {imagenesUrls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Imagen ${idx + 1}`}
                      style={imageBoxStyle}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* FIRMA DIGITAL */}
          <div className="border-b border-black px-4 py-3">
            <div className="border border-black h-24 flex flex-col">
              <canvas
                ref={canvasRef}
                width={600}
                height={90}
                className="w-full h-full"
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

        {/* BOTÓN GENERAR PDF */}
        <div className="flex justify-end p-3">
          <button
            type="submit"
            className="px-4 py-2 text-xs md:text-sm border border-blue-600 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Generar PDF
          </button>
        </div>
      </form>
    </div>
  );
};

export default HojaRegistroHoras;
