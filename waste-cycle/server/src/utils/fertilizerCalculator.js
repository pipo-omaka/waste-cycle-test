// src/utils/fertilizerCalculator.js

// Basic NPK values for different waste types (example values)
const npkValues = {
  cow: { n: 0.5, p: 0.2, k: 0.4 },
  chicken: { n: 1.1, p: 0.8, k: 0.5 },
  pig: { n: 0.6, p: 0.4, k: 0.3 },
  // ... more types
};

// Crop nutrient requirements (example values, kg per hectare)
const cropNeeds = {
  corn: { n: 120, p: 60, k: 60 },
  rice: { n: 100, p: 50, k: 50 },
  // ... more crops
};

function calculateFertilizer(cropType, area, soilType, availableWaste) {
  const needs = cropNeeds[cropType] || cropNeeds.corn; // Default to corn
  const waste = availableWaste || [{ type: 'cow', quantity: 1000 }]; // Example default

  // Calculate total available NPK from waste
  let availableNPK = { n: 0, p: 0, k: 0 };
  waste.forEach(w => {
    const npk = npkValues[w.type] || npkValues.cow;
    availableNPK.n += npk.n * w.quantity;
    availableNPK.p += npk.p * w.quantity;
    availableNPK.k += npk.k * w.quantity;
  });

  // Calculate required NPK for the area
  const requiredNPK = {
    n: needs.n * area,
    p: needs.p * area,
    k: needs.k * area,
  };

  // Calculate deficit
  const deficit = {
    n: Math.max(0, requiredNPK.n - availableNPK.n),
    p: Math.max(0, requiredNPK.p - availableNPK.p),
    k: Math.max(0, requiredNPK.k - availableNPK.k),
  };

  return {
    requiredNPK,
    availableNPK,
    deficit,
    recommendation: `You need to add ${deficit.n.toFixed(2)} kg of N, ${deficit.p.toFixed(2)} kg of P, and ${deficit.k.toFixed(2)} kg of K.`,
  };
}

export {
  calculateFertilizer
};