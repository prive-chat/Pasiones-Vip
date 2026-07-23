// High-privacy simulated credits/token system for Pasiones Vip
export const creditsManager = {
  getCredits(): number {
    const stored = localStorage.getItem('pasiones_vip_user_credits');
    if (stored === null) {
      // Grant 50 credits of courtesy to new users
      localStorage.setItem('pasiones_vip_user_credits', '50');
      return 50;
    }
    return parseInt(stored, 10);
  },

  addCredits(amount: number): number {
    const current = this.getCredits();
    const updated = current + amount;
    localStorage.setItem('pasiones_vip_user_credits', updated.toString());
    
    // Dispatch custom event to update reactivity across other windows/components
    window.dispatchEvent(new Event('pasiones_vip_credits_updated'));
    return updated;
  },

  deductCredits(amount: number): boolean {
    const current = this.getCredits();
    if (current < amount) return false;
    
    const updated = current - amount;
    localStorage.setItem('pasiones_vip_user_credits', updated.toString());
    
    window.dispatchEvent(new Event('pasiones_vip_credits_updated'));
    return true;
  }
};
