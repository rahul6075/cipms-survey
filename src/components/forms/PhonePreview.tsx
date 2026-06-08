"use client"
import { Vote } from "lucide-react"
import { SurveyFieldRenderer } from "./SurveyPreviewRenderer"
import type { FormField } from "@/types"

interface Props {
  title: string
  description: string
  fields: FormField[]
}

export function PhonePreview({ title, description, fields }: Props) {
  return (
    <div className="sticky top-6 flex flex-col items-center">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">Live Preview</p>

      {/* Phone frame */}
      <div className="relative w-[300px] bg-[#1a1a1a] rounded-[44px] p-[10px] shadow-[0_32px_80px_rgba(0,0,0,0.35)]">
        {/* Side buttons */}
        <div className="absolute -left-[3px] top-[88px] w-[3px] h-8 bg-[#2a2a2a] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[132px] w-[3px] h-12 bg-[#2a2a2a] rounded-l-sm" />
        <div className="absolute -left-[3px] top-[192px] w-[3px] h-12 bg-[#2a2a2a] rounded-l-sm" />
        <div className="absolute -right-[3px] top-[140px] w-[3px] h-16 bg-[#2a2a2a] rounded-r-sm" />

        {/* Screen */}
        <div className="bg-white rounded-[36px] overflow-hidden" style={{ height: 580 }}>
          {/* Dynamic island */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-24 h-6 bg-[#1a1a1a] rounded-full" />
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-5 py-1">
            <span className="text-[10px] font-semibold text-gray-800">9:41</span>
            <div className="flex items-center gap-1">
              <div className="flex gap-[2px] items-end h-3">
                {[3, 5, 7, 9].map((h, i) => (
                  <div key={i} style={{ height: h }} className="w-[3px] bg-gray-800 rounded-sm" />
                ))}
              </div>
              <svg className="w-3 h-3 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10C2 5.6 5.6 2 10 2s8 3.6 8 8-3.6 8-8 8-8-3.6-8-8zm8-6c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z" />
              </svg>
              <div className="relative w-5 h-2.5 border border-gray-800 rounded-sm">
                <div className="absolute right-[-3px] top-[3px] h-[6px] w-[2px] bg-gray-800 rounded-r-sm" />
                <div className="absolute left-0 top-0 bottom-0 w-4/5 bg-gray-800 rounded-l-[1px]" />
              </div>
            </div>
          </div>

          {/* Survey content — scrollable */}
          <div className="overflow-y-auto" style={{ height: 510 }}>
            {/* Survey header */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shrink-0">
                <Vote className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 truncate leading-none">
                  {title || "Untitled Survey"}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">CIPMS Survey</p>
              </div>
            </div>

            <div className="px-3 py-3 space-y-3">
              {description && (
                <p className="text-[11px] text-gray-500 leading-relaxed px-1">{description}</p>
              )}

              {fields.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
                    <svg className="w-6 h-6 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-xs text-gray-400 font-medium">No fields yet</p>
                  <p className="text-[10px] text-gray-300 mt-0.5">Add fields to see the preview</p>
                </div>
              ) : (
                <>
                  {fields.map((field, idx) => (
                    <div key={field.id} className="bg-white rounded-xl border border-gray-100 px-3 py-2.5 shadow-sm">
                      <p className="text-[11px] font-semibold text-gray-800 mb-1.5 leading-snug">
                        {field.label || `Question ${idx + 1}`}
                        {field.required && <span className="text-red-400 ml-0.5">*</span>}
                      </p>
                      <div className="scale-[0.88] origin-top-left" style={{ width: "113.6%" }}>
                        <SurveyFieldRenderer field={field} preview />
                      </div>
                    </div>
                  ))}

                  {/* Submit button */}
                  <div className="px-1 pb-3">
                    <div className="w-full py-2.5 rounded-xl bg-orange-500 text-white text-xs font-semibold text-center shadow-[0_2px_8px_rgba(249,115,22,0.3)]">
                      Submit Survey
                    </div>
                    <p className="text-center text-[9px] text-gray-300 mt-2">Powered by CIPMS</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Field count pill */}
      <div className="mt-4 px-3 py-1.5 bg-gray-100 rounded-full text-xs text-gray-500 font-medium">
        {fields.length} field{fields.length !== 1 ? "s" : ""} · Mobile view
      </div>
    </div>
  )
}
