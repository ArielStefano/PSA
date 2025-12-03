// src/components/HojaRegistroHoras.jsx
import React, { useState } from "react";

const HojaRegistroHoras = () => {
  const [responsableEquipo, setResponsableEquipo] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Formulario enviado");
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white border-4 border-blue-600 w-full max-w-5xl text-[11px] md:text-xs"
      >
        {/* ENCABEZADO */}
        <div className="flex border-b border-black">
          {/* Logo */}
          <div className="w-28 md:w-32 border-r border-black flex items-center justify-center p-2">
            {/* Reemplazar por tu <img src="/logo.png" /> */}
            <span className="font-bold text-lg">astap</span>
          </div>

          {/* Título */}
          <div className="flex-1 flex items-center justify-center px-2">
            <h1 className="text-center font-bold uppercase leading-tight">
              Hoja de registro de horas y kilometrajes equipos hidrosuccionadores
            </h1>
          </div>
        </div>

        {/* 🔴 FILAS ELIMINADAS:
            - CLIENTE (fila grande)
            - RESPONSABLE EQUIPO (fila grande)
        */}

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

        {/* FECHA / UBICACIÓN / CLIENTE / RESPONSABLE EQUIPO (este RESPONSABLE es el que usamos para la firma) */}
        <div className="grid grid-cols-12 border-b border-black">
          {/* Fecha de inspección + ubicación */}
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

          {/* Cliente + Responsable equipo (este nombre se copiará bajo la firma) */}
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

        {/* KILÓMETROS + IMAGEN (con input file en la parte derecha) */}
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

          {/* Cuadro de IMAGEN con subida de archivo */}
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

        {/* IMÁGENES (generales) */}
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

        {/* 🟩 ESPACIO PARA FIRMA DIGITAL + NOMBRE DEL RESPONSABLE */}
        <div className="border-b border-black px-4 py-3">
          <div className="border border-black h-24 flex items-center justify-center">
            <span className="text-xs text-slate-500 text-center">
              Espacio para firma digital del responsable del equipo
            </span>
          </div>
          <p className="text-xs text-center mt-2">
            {responsableEquipo || "Nombre del responsable del equipo"}
          </p>
        </div>

        {/* BOTÓN ENVIAR */}
        <div className="flex justify-end p-3">
          <button
            type="submit"
            className="px-4 py-2 text-xs md:text-sm border border-blue-600 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700"
          >
            Guardar registro
          </button>
        </div>
      </form>
    </div>
  );
};

export default HojaRegistroHoras;
