"use client"

import React, { useState, useMemo, useCallback } from 'react'
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Plus, X } from 'lucide-react'

interface Cut {
  length: number;
  quantity: number;
}

interface CutPlan {
  cuts: number[];
  waste: number;
}

export default function AluminumExtrusionCalculator() {
  const [numExtrusions, setNumExtrusions] = useState<number>(25)
  const [extrusionLength, setExtrusionLength] = useState<number>(2000)
  const [cuts, setCuts] = useState<Cut[]>([{ length: 1500, quantity: 6 }])

  const calculateOptimalCutPlan = useCallback((): CutPlan[] => {
    const sortedCuts = cuts
      .map(cut => ({ ...cut }))
      .sort((a, b) => b.length - a.length)

    const plans: CutPlan[] = []
    let remainingCuts = [...sortedCuts]
    let currentExtrusionIndex = 0

    while (currentExtrusionIndex < numExtrusions && remainingCuts.some(cut => cut.quantity > 0)) {
      let remainingLength = extrusionLength
      const currentCuts: number[] = []

      for (const cut of remainingCuts) {
        while (cut.quantity > 0 && remainingLength >= cut.length) {
          currentCuts.push(cut.length)
          remainingLength -= cut.length
          cut.quantity--
        }
      }

      plans.push({
        cuts: currentCuts,
        waste: remainingLength
      })

      currentExtrusionIndex++
    }

    while (currentExtrusionIndex < numExtrusions) {
      plans.push({
        cuts: [],
        waste: extrusionLength
      })
      currentExtrusionIndex++
    }

    return plans
  }, [cuts, numExtrusions, extrusionLength])

  const cutPlans = useMemo(() => calculateOptimalCutPlan(), [calculateOptimalCutPlan])

  const totalCutsNeeded = useMemo(() => {
    return cuts.reduce((acc, cut) => acc + cut.quantity, 0)
  }, [cuts])

  const totalCutsMade = useMemo(() => {
    return cutPlans.reduce((acc, plan) => acc + plan.cuts.length, 0)
  }, [cutPlans])

  const addCut = useCallback(() => {
    setCuts(prevCuts => [...prevCuts, { length: 100, quantity: 1 }])
  }, [])

  const updateCut = useCallback((index: number, field: 'length' | 'quantity', value: number) => {
    setCuts(prevCuts => {
      const updatedCuts = [...prevCuts]
      updatedCuts[index][field] = value
      return updatedCuts
    })
  }, [])

  const removeCut = useCallback((index: number) => {
    setCuts(prevCuts => prevCuts.filter((_, i) => i !== index))
  }, [])

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">Aluminum Extrusion Cut Calculator</h1>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numExtrusions" className="text-gray-400">
                Number of Extrusions
              </Label>
              <Input
                id="numExtrusions"
                type="number"
                value={numExtrusions}
                onChange={(e) => setNumExtrusions(Math.max(1, parseInt(e.target.value) || 0))}
                min="1"
                className="font-mono border-gray-800 bg-black text-white focus:ring-gray-700 focus:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extrusionLength" className="text-gray-400">
                Extrusion Length (mm)
              </Label>
              <Input
                id="extrusionLength"
                type="number"
                value={extrusionLength}
                onChange={(e) => setExtrusionLength(Math.max(1, parseInt(e.target.value) || 0))}
                min="1"
                className="font-mono border-gray-800 bg-black text-white focus:ring-gray-700 focus:border-gray-700"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg text-gray-400">Cuts</h2>
              <Button 
                onClick={addCut} 
                variant="outline" 
                className="h-8 border-gray-800 hover:bg-gray-900 text-gray-400"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Cut
              </Button>
            </div>
            <div className="space-y-2">
              {cuts.map((cut, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    type="number"
                    value={cut.length}
                    onChange={(e) => updateCut(index, 'length', Math.max(1, parseInt(e.target.value) || 0))}
                    min="1"
                    placeholder="Length (mm)"
                    className="w-1/3 font-mono border-gray-800 bg-black text-white focus:ring-gray-700 focus:border-gray-700"
                  />
                  <Input
                    type="number"
                    value={cut.quantity}
                    onChange={(e) => updateCut(index, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                    min="1"
                    placeholder="Quantity"
                    className="w-1/3 font-mono border-gray-800 bg-black text-white focus:ring-gray-700 focus:border-gray-700"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeCut(index)}
                    disabled={cuts.length === 1}
                    className="hover:bg-gray-900 text-gray-400 disabled:text-gray-800"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-lg text-gray-400">Cut Plan Visualization</h2>
            <div className="space-y-2">
              {cutPlans.map((plan, index) => (
                <div key={index} className="flex items-center">
                  <span className="w-8 text-sm text-gray-600 font-mono">{index + 1}.</span>
                  <div className="flex-1 h-8 bg-gray-900 rounded overflow-hidden flex">
                    {plan.cuts.map((cut, cutIndex) => (
                      <div
                        key={cutIndex}
                        className="h-full flex items-center justify-center text-xs border-r border-black bg-gray-800"
                        style={{ width: `${(cut / extrusionLength) * 100}%` }}
                      >
                        {cut}
                      </div>
                    ))}
                    {plan.waste > 0 && (
                      <div
                        className="h-full flex items-center justify-center text-xs bg-gray-950 text-gray-500"
                        style={{ width: `${(plan.waste / extrusionLength) * 100}%` }}
                      >
                        {plan.waste}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2 border border-gray-800 rounded p-4 font-mono">
            <h2 className="text-lg text-gray-400 mb-3">Summary</h2>
            {cuts.map((cut, index) => (
              <p key={index} className="text-sm text-gray-300">
                → {cut.length}mm cuts: {
                  cutPlans.reduce((sum, plan) => sum + plan.cuts.filter(c => c === cut.length).length, 0)
                } of {cut.quantity} needed
              </p>
            ))}
            <div className="border-t border-gray-800 my-2" />
            <p className="text-sm text-gray-300">
              → Total cuts: {totalCutsMade} of {totalCutsNeeded} needed
            </p>
            <p className="text-sm text-gray-300">
              → Total waste: {cutPlans.reduce((sum, plan) => sum + plan.waste, 0)}mm
            </p>
            <p className="text-sm text-gray-300">
              → Extrusions: {cutPlans.filter(plan => plan.cuts.length > 0).length} of {numExtrusions} used
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

