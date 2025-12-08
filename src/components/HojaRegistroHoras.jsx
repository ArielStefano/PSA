// src/components/HojaRegistroHoras.jsx
import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

const HojaRegistroHoras = () => {
  const [responsableEquipo, setResponsableEquipo] = useState("");
  const [imagenChasisUrl, setImagenChasisUrl] = useState(null);
  const [imagenesUrls, setImagenesUrls] = useState([]);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const pdfRef = useRef(null);

  // ====== FIRMA: COORDENADAS CORREGIDAS ======
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

  // ====== GENERAR PDF (HORIZONTAL) AJUSTADO A LA HOJA ======
  const handleGeneratePdf = async (e) => {
    e.preventDefault();
    const input = pdfRef.current;
    if (!input) return;

    const canvas = await html2canvas(input, {
      scale: 2,
      useCORS: true,
    });

    const imgData = canvas.toDataURL("image/png");

    // "l" = landscape (horizontal)
    const pdf = new jsPDF("l", "mm", "a4");

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    const imgProps = pdf.getImageProperties(imgData);

    // Ajuste máximo para que toda la imagen
    // quepa en UNA hoja horizontal
    const ratio = Math.min(
      pdfWidth / imgProps.width,
      pdfHeight / imgProps.height
    );

    const imgWidth = imgProps.width * ratio;
    const imgHeight = imgProps.height * ratio;

    const x = (pdfWidth - imgWidth) / 2;
    const y = (pdfHeight - imgHeight) / 2;

    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save("hoja-registro.pdf");
  };

  // ====== IMAGEN CHASIS (PREVIEW 5x5 cm) ======
  const handleImagenChasisChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) {
      setImagenChasisUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setImagenChasisUrl(url);
  };

  // ====== IMÁGENES GENERALES (MULTIPLES PREVIEWS 5x5 cm) ======
  const handleImagenesChange = (e) => {
    const files = Array.from(e.target.files || []);
    const urls = files.map((file) => URL.createObjectURL(file));
    setImagenesUrls(urls);
  };

  // ~5x5 cm ≈ 190x190 px
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

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleGeneratePdf}
        className="w-full max-w-5xl text-[11px] md:text-xs"
      >
        {/* Todo lo que está dentro de pdfRef es lo que irá al PDF */}
        <div
          ref={pdfRef}
          className="bg-white border-4 border-blue-600 w-full"
        >
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
                  Fecha de inspección:
                </label>
                <div className="flex-1 grid grid-cols-3">
                  <input
                    className="border-r border-black px-2 py-1 outline-none text-center text-blue-600"
                    name="dia"
                    placeholder="DD"
                  />
                  <input
                    className="border-r border-black px-2 py-1 outline-none text-center text-blue-600"
                    name="mes"
                    placeholder="MM"
                  />
                  <input
                    className="px-2 py-1 outline-none text-center text-blue-600"
                    name="anio"
                    placeholder="AAAA"
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
              {/* Ignorado por html2canvas => no sale en PDF */}
              <button
                type="button"
                onClick={clearSignature}
                data-html2canvas-ignore="true"
                className="ml-4 px-2 py-1 text-[10px] border border-slate-400 rounded hover:bg-slate-100"
              >
                Borrar firma
              </button>
            </div>
          </div>
        </div>

        {/* BOTÓN GENERAR PDF (no entra en la captura) */}
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
