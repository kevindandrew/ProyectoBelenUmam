"use client";
import React from "react";
import { X, Plus } from "lucide-react";

const ScheduleTable = ({
  courses,
  timeSlots,
  days, // ahora es un array de objetos { id, name }
  availableClassrooms,
  onCellClick,
  onDeleteCourse,
}) => {
  const getCourseForSlot = (classroom, time, dayId) => {
    return (
      courses.find(
        (course) =>
          course.classroom.value === classroom.value &&
          course.time === time &&
          course.day === dayId
      ) || null
    );
  };
  console.log();
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50">
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200 sticky left-0 bg-gray-50 z-10 min-w-32">
                Hora
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-900 border-b border-gray-200 sticky left-32 bg-gray-50 z-10 min-w-40">
                Aula
              </th>
              {days.map((day) => (
                <th
                  key={day.id}
                  className="px-4 py-3 text-center text-sm font-medium text-gray-900 border-b border-gray-200 min-w-48"
                >
                  {day.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((time, timeIndex) => (
              <React.Fragment key={time}>
                {availableClassrooms.map((classroom, classroomIndex) => (
                  <tr
                    key={`${time}-${classroom.value}`}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    {/* Hora */}
                    {classroomIndex === 0 && (
                      <td
                        rowSpan={availableClassrooms.length}
                        className="px-4 py-3 text-sm font-bold text-gray-900 bg-blue-50 border-r border-gray-200 sticky left-0 z-10 align-top"
                      >
                        <div className="bg-blue-600 text-white px-3 py-2 rounded-lg font-semibold text-center shadow-sm">
                          {time}
                        </div>
                      </td>
                    )}

                    {/* Aula */}
                    <td className="px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-r border-gray-200 sticky left-32 z-10">
                      <div className="bg-gray-100 text-gray-800 px-3 py-2 rounded-lg border border-gray-200 font-medium text-center">
                        {classroom.label}
                      </div>
                    </td>

                    {/* Días */}
                    {days.map((day) => {
                      const course = getCourseForSlot(classroom, time, day.id);
                      const cellKey = `${time}-${classroom.value}-${day.id}`;

                      return (
                        <td
                          key={cellKey}
                          className="px-2 py-2 relative align-top"
                        >
                          {course ? (
                            <div
                              className={`${course.color} rounded-lg p-3 border-2 cursor-pointer hover:shadow-md transition-shadow relative group`}
                            >
                              <button
                                onClick={() => onDeleteCourse(course.id)}
                                className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white rounded-full p-1 hover:bg-gray-100"
                              >
                                <X size={12} />
                              </button>
                              <div className="text-xs font-semibold mb-1">
                                {course.subject}
                              </div>
                              <div className="text-xs">{course.professor}</div>
                            </div>
                          ) : (
                            <div
                              onClick={() => onCellClick(time, day.id)}
                              className="h-16 border-2 border-dashed border-gray-200 rounded-lg cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors flex items-center justify-center group"
                            >
                              <div className="flex items-center gap-1 text-gray-400 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus size={14} />
                                <span>Disponible</span>
                              </div>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {/* Separador visual */}
                {timeIndex < timeSlots.length - 1 && (
                  <tr>
                    <td
                      colSpan={days.length + 2}
                      className="h-3 bg-gray-100 border-b-2 border-gray-200"
                    ></td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ScheduleTable;
