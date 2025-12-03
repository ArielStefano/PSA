// src/components/HojaRegistroHoras.jsx
import React, { useState, useRef } from "react";
import { jsPDF } from "jspdf";

const HojaRegistroHoras = () => {
  const [responsableEquipo, setResponsableEquipo] = useState("");
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // ====== FIRMA: DIBUJO EN CANVAS ======
  const getCoords = (e, canvas) => {
    const rect = canvas.getBoundingClientRect();
    // Soporta mouse y touch
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  };

  const startDrawing = (e) => {
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
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const { x, y } = getCoords(e, canvas);

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // ====== GENERAR PDF CON FIRMA ======
  const handleGeneratePdf = (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const clienteInspeccion = formData.get("clienteInspeccion") || "";
    const numeroEquipo = formData.get("numeroEquipo") || "";
    const ubicacion = formData.get("ubicacion") || "";
    const dia = formData.get("dia") || "";
    const mes = formData.get("mes") || "";
    const anio = formData.get("anio") || "";

    const doc = new jsPDF("p", "mm", "a4");

    // Título simple
    doc.setFontSize(12);
    doc.text(
      "Hoja de registro de horas y kilometrajes equipos hidrosuccionadores",
      10,
      15
    );

    doc.setFontSize(10);
    doc.text(`Cliente: ${clienteInspeccion}`, 10, 25);
    doc.text(`Responsable equipo: ${responsableEquipo}`, 10, 30);
    doc.text(`Nº de equipo: ${numeroEquipo}`, 10, 35);
    doc.text(`Ubicación: ${ubicacion}`, 10, 40);
    doc.text(`Fecha de inspección: ${dia}/${mes}/${anio}`, 10, 45);

    // Firma como imagen
    const canvas = canvasRef.current;
    if (canvas) {
      const signatureDataUrl = canvas.toDataURL("image/png");
      // x, y, width, height en mm
      doc.text("Firma responsable equipo:", 10, 180);
      doc.addImage(signatureDataUrl, "PNG", 10, 185, 80, 30);
      doc.text(responsableEquipo || "", 10, 220);
    }

    doc.save("hoja-registro.pdf");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleGeneratePdf}
        className="bg-white border-4 border-blue-600 w-full max-w-5xl text-[11px] md:text-xs"
      >
        {/* ENCABEZADO */}
        <div className="flex border-b border-black">
          <div className="w-28 md:w-32 border-r border-black flex items-center justify-center p-2">
            <span className="font-bold text-lg">astap</span>
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
                className="flex-1 px-2 py-1 outline-none"
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
                  className="border-r border-black px-2 py-1 outline-none text-center"
                  name="dia"
                  placeholder="DD"
                />
                <input
                  className="border-r border-black px-2 py-1 outline-none text-center"
                  name="mes"
                  placeholder="MM"
                />
                <input
                  className="px-2 py-1 outline-none text-center"
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
                className="flex-1 px-2 py-1 outline-none"
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
                className="flex-1 px-2 py-1 outline-none"
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
                className="flex-1 px-2 py-1 outline-none"
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
              className="flex-1 px-2 py-1 outline-none resize-none h-20"
              name="kilometros"
            />
          </div>

          <div className="border-l border-black flex flex-col">
            <div className="border-b border-black text-center py-1 font-semibold uppercase">
              Imagen
            </div>
            <div className="flex-1 flex flex-col items-center justify-center px-1 text-center gap-1">
              <span className="text-[10px]">
                Adjuntar imagen / foto del chasis
              </span>
              <input
                type="file"
                name="imagenChasis"
                accept="image/*"
                className="text-[10px]"
              />
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
            className="flex-1 px-2 py-1 outline-none resize-none h-16"
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
            className="flex-1 px-2 py-1 outline-none resize-none h-16"
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
            className="flex-1 px-2 py-1 outline-none resize-none h-20"
            name="detalles"
          />
        </div>

        {/* IMÁGENES GENERALES */}
        <div className="flex border-b border-black">
          <label className="w-40 border-r border-black px-2 py-1 font-semibold uppercase">
            Imágenes:
          </label>
          <div className="flex-1 flex items-center px-2 py-1">
            <input
              type="file"
              multiple
              className="text-[10px]"
              name="imagenes"
            />
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
            <p className="text-xs text-center flex-1">
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

