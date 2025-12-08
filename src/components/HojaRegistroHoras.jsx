// src/components/HojaRegistroHoras.jsx
import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";

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

  // ====== IMAGEN CHASIS (GUARDADA COMO DATA URL PARA USARLA EN PDF) ======
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

  // ====== GENERAR PDF PROFESIONAL CON jsPDF ======
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

    // Columna izquierda (texto) y derecha (imágenes)
    const leftWidth = pageWidth * 0.55;
    const rightX = margin + leftWidth + 5;

    // Encabezado
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("ASTAP", margin, margin + 5);

    doc.setFontSize(12);
    doc.text(
      "HOJA DE REGISTRO DE HORAS Y KILOMETRAJES EQUIPOS HIDROSUCCIONADORES",
      margin + 35,
      margin + 5
    );

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);

    let y = margin + 15;

    // Datos principales (lado izquierdo)
    doc.text(`Cliente: ${clienteInspeccion}`, margin, y);
    y += 5;
    doc.text(`Responsable equipo: ${responsableEquipo}`, margin, y);
    y += 5;
    doc.text(`N° equipo: ${numeroEquipo}`, margin, y);
    y += 5;
    doc.text(`Fecha: ${fechaStr}`, margin, y);
    y += 5;
    doc.text(`Ubicación: ${ubicacion}`, margin, y);
    y += 10;

    // Sección Kilómetros
    doc.setFont("helvetica", "bold");
    doc.text("Kilómetros:", margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    doc.text(km.toString(), margin, y, { maxWidth: leftWidth - margin });
    y += 10;

    // Sección Horas generales
    doc.setFont("helvetica", "bold");
    doc.text("Horas (generales):", margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    doc.text(horasGenerales.toString(), margin, y, {
      maxWidth: leftWidth - margin,
    });
    y += 10;

    // Sección Horas específicas
    doc.setFont("helvetica", "bold");
    doc.text("Horas (específicas):", margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    doc.text(horasEspecificas.toString(), margin, y, {
      maxWidth: leftWidth - margin,
    });
    y += 10;

    // Sección Detalles
    doc.setFont("helvetica", "bold");
    doc.text("Detalles:", margin, y);
    doc.setFont("helvetica", "normal");
    y += 5;
    doc.text(detalles.toString(), margin, y, {
      maxWidth: leftWidth - margin,
    });

    // ================= IMÁGENES (COLUMNA DERECHA) =================
    let imgY = margin + 15;

    const addFittedImage = (dataUrl, x, y, boxW, boxH) => {
      if (!dataUrl) return;
      const props = doc.getImageProperties(dataUrl);
      const ratio = Math.min(boxW / props.width, boxH / props.height);
      const w = props.width * ratio;
      const h = props.height * ratio;
      const offsetX = x + (boxW - w) / 2;
      const offsetY = y + (boxH - h) / 2;
      doc.addImage(dataUrl, "PNG", offsetX, offsetY, w, h);
    };

    // Imagen chasis (bloque grande arriba)
    const chasisBoxW = pageWidth - rightX - margin;
    const chasisBoxH = 60;

    if (imagenChasisUrl) {
      doc.setFont("helvetica", "bold");
      doc.text("Imagen chasis:", rightX, imgY - 2);
      doc.setDrawColor(0);
      doc.rect(rightX, imgY, chasisBoxW, chasisBoxH);
      addFittedImage(imagenChasisUrl, rightX, imgY, chasisBoxW, chasisBoxH);
      imgY += chasisBoxH + 8;
    }

    // Otras imágenes (en grilla bajo chasis)
    const otherBoxW = (pageWidth - rightX - margin - 5) / 2; // 2 columnas
    const otherBoxH = 40;
    let col = 0;

    if (imagenesUrls.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.text("Imágenes adicionales:", rightX, imgY - 2);

      imgY += 2;

      imagenesUrls.slice(0, 4).forEach((url, index) => {
        const x = rightX + col * (otherBoxW + 5);
        const yPos = imgY;
        doc.setDrawColor(0);
        doc.rect(x, yPos, otherBoxW, otherBoxH);
        addFittedImage(url, x, yPos, otherBoxW, otherBoxH);

        col += 1;
        if (col === 2) {
          col = 0;
          imgY += otherBoxH + 5;
        }
      });
    }

    // ================= FIRMA (ABAJO) =================
    const firmaBoxY = pageHeight - 40;
    const firmaBoxW = 60;
    const firmaBoxH = 25;

    doc.setFont("helvetica", "bold");
    doc.text("Firma responsable:", margin, firmaBoxY - 2);
    doc.setDrawColor(0);
    doc.rect(margin, firmaBoxY, firmaBoxW, firmaBoxH);

    if (firmaDataUrl) {
      addFittedImage(firmaDataUrl, margin, firmaBoxY, firmaBoxW, firmaBoxH);
    }

    doc.setFont("helvetica", "normal");
    doc.text(
      responsableEquipo || "",
      margin,
      firmaBoxY + firmaBoxH + 5
    );

    doc.save("hoja-registro.pdf");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleGeneratePdf}
        className="w-full max-w-5xl text-[11px] md:text-xs"
      >
        {/* CONTENIDO VISUAL (FORMULARIO) */}
        <div className="bg-white border-4 border-blue-600 w-full">
          {/* ENCABEZADO */}
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
