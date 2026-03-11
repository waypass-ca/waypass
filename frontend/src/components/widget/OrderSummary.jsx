export function OrderSummary({ selectedPackage, selectedAddons = [] }) {
  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0)
  const total = (selectedPackage?.price ?? 0) + addonsTotal

  return (
    <div className="bg-charcoal rounded-xl p-6 text-warm-white">
      <h3 className="font-display text-xl mb-5">Order Summary</h3>

      {/* Line items */}
      <div className="space-y-0">
        {selectedPackage && (
          <div className="flex justify-between items-center py-3 border-b border-white/10">
            <div>
              <p className="text-sm font-sans font-medium">{selectedPackage.name} Plan</p>
              <p className="text-xs text-white/50 font-sans mt-0.5">Base package</p>
            </div>
            <span className="text-sm font-sans font-medium">${selectedPackage.price.toLocaleString()}</span>
          </div>
        )}

        {selectedAddons.map(addon => (
          <div key={addon.id} className="flex justify-between items-center py-3 border-b border-white/10">
            <div>
              <p className="text-sm font-sans font-medium">{addon.name}</p>
              <p className="text-xs text-white/50 font-sans mt-0.5">Add-on</p>
            </div>
            <span className="text-sm font-sans font-medium">+${addon.price}</span>
          </div>
        ))}
      </div>

      {/* Total */}
      <div className="flex justify-between items-baseline mt-4 pt-2">
        <span className="text-sm font-sans text-white/60">Total</span>
        <span className="font-display text-3xl font-light">${total.toLocaleString()}</span>
      </div>
    </div>
  )
}
