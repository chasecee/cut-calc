"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface Cut {
  length: number;
  quantity: number;
}

interface CutPlan {
  cuts: number[];
  waste: number;
}

type Unit = "mm" | "cm" | "m" | "in" | "ft" | "yd";

const unitConversions: Record<Unit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
  yd: 914.4,
};

export default function AluminumExtrusionCalculator() {
  const [numExtrusions, setNumExtrusions] = useState<number>(10);
  const [extrusionLength, setExtrusionLength] = useState<number>(2000);
  const [cuts, setCuts] = useState<Cut[]>([{ length: 1500, quantity: 6 }]);
  const [unit, setUnit] = useState<Unit>("mm");
  const [kerfWidth, setKerfWidth] = useState<number>(3.2);
  const [kerfUnit, setKerfUnit] = useState<Unit>("mm");

  const convertToMm = useCallback(
    (value: number) => {
      return value * unitConversions[unit];
    },
    [unit]
  );

  const convertFromMm = useCallback(
    (value: number) => {
      return value / unitConversions[unit];
    },
    [unit]
  );

  const getKerfInMm = useCallback(() => {
    return kerfWidth * unitConversions[kerfUnit];
  }, [kerfWidth, kerfUnit]);

  const calculateOptimalCutPlan = useCallback((): CutPlan[] => {
    const stockLength = convertToMm(extrusionLength);
    const kerfWidthMm = getKerfInMm();

    const convertedCuts = cuts.map((cut) => ({
      ...cut,
      length: convertToMm(cut.length) + kerfWidthMm,
    }));

    const sortedCuts = [...convertedCuts].sort((a, b) => b.length - a.length);
    const plans: CutPlan[] = [];
    const remainingCuts = [...sortedCuts];
    let currentExtrusionIndex = 0;

    while (
      currentExtrusionIndex < numExtrusions &&
      remainingCuts.some((cut) => cut.quantity > 0)
    ) {
      let remainingLength = stockLength;
      const currentCuts: number[] = [];

      for (const cut of remainingCuts) {
        while (cut.quantity > 0 && remainingLength >= cut.length) {
          currentCuts.push(cut.length - kerfWidthMm);
          remainingLength -= cut.length;
          cut.quantity--;
        }
      }

      plans.push({
        cuts: currentCuts,
        waste: remainingLength,
      });

      currentExtrusionIndex++;
    }

    while (currentExtrusionIndex < numExtrusions) {
      plans.push({
        cuts: [],
        waste: stockLength,
      });
      currentExtrusionIndex++;
    }

    return plans.map((plan) => ({
      cuts: plan.cuts.map((cut) => convertFromMm(cut)),
      waste: convertFromMm(plan.waste),
    }));
  }, [
    cuts,
    numExtrusions,
    extrusionLength,
    getKerfInMm,
    unit,
    convertToMm,
    convertFromMm,
  ]);

  useEffect(() => {
    setExtrusionLength((prev) => {
      const inMm = prev * unitConversions[unit];
      return Number((inMm / unitConversions[unit]).toFixed(2));
    });

    setCuts((prevCuts) =>
      prevCuts.map((cut) => ({
        ...cut,
        length: Number(
          (
            (cut.length * unitConversions[unit]) /
            unitConversions[unit]
          ).toFixed(2)
        ),
      }))
    );
  }, [unit]);

  const cutPlans = useMemo(
    () => calculateOptimalCutPlan(),
    [calculateOptimalCutPlan]
  );

  const totalCutsNeeded = useMemo(() => {
    return cuts.reduce((acc, cut) => acc + cut.quantity, 0);
  }, [cuts]);

  const totalCutsMade = useMemo(() => {
    return cutPlans.reduce((acc, plan) => acc + plan.cuts.length, 0);
  }, [cutPlans]);

  const addCut = useCallback(() => {
    setCuts((prevCuts) => [...prevCuts, { length: 100, quantity: 1 }]);
  }, []);

  const updateCut = useCallback(
    (index: number, field: "length" | "quantity", value: number) => {
      setCuts((prevCuts) => {
        const updatedCuts = [...prevCuts];
        updatedCuts[index][field] = value;
        return updatedCuts;
      });
    },
    []
  );

  const removeCut = useCallback((index: number) => {
    setCuts((prevCuts) => prevCuts.filter((_, i) => i !== index));
  }, []);

  return (
    <div className="min-h-screen bg-black text-white font-mono">
      <div className="max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-bold mb-8">
          Aluminum Extrusion Cut Calculator
        </h1>

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="numExtrusions" className="text-gray-400">
                Number of Extrusions
              </Label>
              <Input
                id="numExtrusions"
                type="number"
                value={numExtrusions}
                onChange={(e) =>
                  setNumExtrusions(Math.max(1, parseInt(e.target.value) || 0))
                }
                min="1"
                className="font-mono border-gray-800 bg-black text-white focus:ring-gray-700 focus:border-gray-700"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="extrusionLength" className="text-gray-400">
                Extrusion Length
              </Label>
              <div className="flex gap-2">
                <Input
                  id="extrusionLength"
                  type="number"
                  value={extrusionLength}
                  onChange={(e) =>
                    setExtrusionLength(
                      Math.max(1, parseInt(e.target.value) || 0)
                    )
                  }
                  min="1"
                  className="flex-1 font-mono border-gray-800 bg-black text-white focus:ring-gray-700 focus:border-gray-700"
                />
                <Select
                  value={unit}
                  onValueChange={(value: Unit) => setUnit(value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                    <SelectItem value="ft">ft</SelectItem>
                    <SelectItem value="yd">yd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="kerfWidth" className="text-gray-400">
                Blade Width
              </Label>
              <div className="flex gap-2">
                <Input
                  id="kerfWidth"
                  type="number"
                  value={kerfWidth}
                  onChange={(e) =>
                    setKerfWidth(Math.max(0, parseFloat(e.target.value) || 0))
                  }
                  min="0"
                  step="0.1"
                  className="flex-1 font-mono border-gray-800 bg-black text-white focus:ring-gray-700 focus:border-gray-700"
                />
                <Select
                  value={kerfUnit}
                  onValueChange={(value: Unit) => setKerfUnit(value)}
                >
                  <SelectTrigger className="w-24">
                    <SelectValue placeholder="Unit" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mm">mm</SelectItem>
                    <SelectItem value="cm">cm</SelectItem>
                    <SelectItem value="m">m</SelectItem>
                    <SelectItem value="in">in</SelectItem>
                    <SelectItem value="ft">ft</SelectItem>
                    <SelectItem value="yd">yd</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-start gap-2">
              <h2 className="text-lg text-gray-400">Cuts</h2>
            </div>

            <div className="grid grid-cols-12 gap-2 mb-2">
              <div className="col-span-5">
                <Label className="text-gray-500">Cut Length ({unit})</Label>
              </div>
              <div className="col-span-5">
                <Label className="text-gray-500">Quantity</Label>
              </div>
              <div className="col-span-2" />
            </div>

            <div className="space-y-2">
              {cuts.map((cut, index) => (
                <div
                  key={index}
                  className="grid grid-cols-12 gap-2 items-start"
                >
                  <div className="col-span-5">
                    <Input
                      type="number"
                      value={cut.length}
                      onChange={(e) => {
                        const newLength = Math.max(
                          1,
                          parseFloat(e.target.value) || 0
                        );
                        updateCut(index, "length", newLength);
                      }}
                      min="1"
                      className={cn(
                        "font-mono border-gray-800 bg-black text-white focus:ring-gray-700 focus:border-gray-700",
                        convertToMm(cut.length) >
                          convertToMm(extrusionLength) &&
                          "border-red-800 focus:border-red-700 text-red-500"
                      )}
                    />
                    {convertToMm(cut.length) > convertToMm(extrusionLength) && (
                      <div className="text-xs text-red-500 mt-1">
                        Exceeds extrusion length
                      </div>
                    )}
                  </div>
                  <div className="col-span-5">
                    <Input
                      type="number"
                      value={cut.quantity}
                      onChange={(e) =>
                        updateCut(
                          index,
                          "quantity",
                          Math.max(1, parseInt(e.target.value) || 0)
                        )
                      }
                      min="1"
                      className="font-mono border-gray-800 bg-black text-white focus:ring-gray-700 focus:border-gray-700"
                    />
                  </div>
                  <div className="col-span-2">
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
                </div>
              ))}
            </div>

            <Button
              onClick={addCut}
              variant="default"
              className="h-8 border-gray-800 hover:bg-gray-900 text-gray-400"
            >
              <Plus className="h-4 w-4 mr-2" /> Add Cut
            </Button>
          </div>
          <div className="space-y-2 border border-gray-800 rounded p-4 font-mono">
            <h2 className="text-lg text-gray-400 mb-3">Summary</h2>
            {cuts.map((cut, index) => (
              <p key={index} className="text-sm text-gray-300">
                → {cut.length.toFixed(1)}
                {unit} cuts:{" "}
                {cutPlans.reduce(
                  (sum, plan) =>
                    sum + plan.cuts.filter((c) => c === cut.length).length,
                  0
                )}{" "}
                of {cut.quantity} needed
              </p>
            ))}
            <div className="border-t border-gray-800 my-2" />
            <p className="text-sm text-gray-300">
              → Total cuts: {totalCutsMade} of {totalCutsNeeded} needed
            </p>
            <p className="text-sm text-gray-300">
              → Total waste:{" "}
              {cutPlans.reduce((sum, plan) => sum + plan.waste, 0).toFixed(1)}
              {unit}
            </p>
            <p className="text-sm text-gray-300">
              → Extrusions:{" "}
              {cutPlans.filter((plan) => plan.cuts.length > 0).length} of{" "}
              {numExtrusions} used
            </p>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg text-gray-400">Cut Plan Visualization</h2>
            <div className="space-y-2">
              {cutPlans.map((plan, index) => (
                <div key={index} className="flex items-center">
                  <span className="w-8 text-sm text-gray-600 font-mono">
                    {index + 1}.
                  </span>
                  <div className="flex-1 h-8 bg-gray-900 rounded overflow-hidden flex">
                    {plan.cuts.length > 0 ? (
                      // Show cuts if there are any
                      plan.cuts.map((cut, cutIndex) => (
                        <div key={cutIndex} className="contents">
                          <div
                            className="h-full bg-gray-800 flex items-center justify-center text-xs"
                            style={{
                              width: `${(cut / extrusionLength) * 100}%`,
                            }}
                          >
                            {cut.toFixed(1)}
                          </div>
                          <div
                            className="h-full min-w-px bg-red-900/30 flex items-center justify-center text-xs"
                            style={{
                              width: `${
                                (getKerfInMm() / convertToMm(extrusionLength)) *
                                100
                              }%`,
                            }}
                          >
                            <div className="opacity-50 absolute">
                              {kerfWidth > 0 && `${kerfWidth}${kerfUnit}`}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      // Show full length if no cuts
                      <div
                        className="h-full bg-gray-950 flex items-center justify-center text-xs text-gray-500"
                        style={{ width: "100%" }}
                      >
                        {extrusionLength.toFixed(1)}
                      </div>
                    )}
                    {plan.waste > 0 && plan.cuts.length > 0 && (
                      <div
                        className="h-full bg-gray-950 flex items-center justify-center text-xs text-gray-500"
                        style={{
                          width: `${(plan.waste / extrusionLength) * 100}%`,
                        }}
                      >
                        {plan.waste.toFixed(1)}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
