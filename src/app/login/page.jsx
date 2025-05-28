// src/LoginForm.jsx
import React from "react";

const LoginForm = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      <div className="bg-white rounded-lg shadow-xl flex max-w-4xl w-full overflow-hidden">
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">
              BIENVENIDO
            </h2>
          </div>

          <form>
            <div className="mb-6">
              <label
                htmlFor="username"
                className="block text-gray-700 text-sm font-medium mb-2"
              >
                Nombre de usuario
              </label>
              <input
                type="text"
                id="username"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa tu nombre de usuario"
              />
            </div>

            <div className="mb-6">
              <label
                htmlFor="password"
                className="block text-gray-700 text-sm font-medium mb-2"
              >
                Contraseña
              </label>
              <input
                type="password"
                id="password"
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ingresa tu contraseña"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-[#22dd9f] text-white py-3 rounded-md font-sans font-semibold hover:bg-[#159268] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              INICIAR SESIÓN
            </button>
          </form>
        </div>

        <div className="hidden lg:flex lg:w-1/2 bg-slate-800 relative items-center justify-center p-8">
          <div className="relative w-full h-full flex items-center justify-center">
            <div className="w-full h-full bg-no-repeat bg-center bg-contain"></div>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-700 p-4">
              <p className="text-7xl font-black text-center text-[#33ffbb] tracking-[15]">
                UMAM
              </p>
              <p className="font-sans font-bold tracking-tight text-center text-white">
                UNIVERSIDAD MUNICIPAL DEL ADULTO MAYOR
              </p>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <br></br>
              <p className="text-2x1 text-center text-white">
                Dirección de Atención Social Integral
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
