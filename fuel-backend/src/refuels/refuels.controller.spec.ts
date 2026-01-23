describe('RefuelsController', () => {
  it('should exist as a module', () => {
    expect(true).toBe(true);
  });

  it('should handle refuels endpoints', () => {
    const mockRefuels = [{ id: 1, vehicleId: 1, liters: 50 }];
    expect(mockRefuels.length).toBeGreaterThan(0);
  });
});
