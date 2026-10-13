// Fenêtre glissante : la BDNB répond 429 au-delà de 120 requêtes/minute (portail api-portail.bdnb.io)
export class LimiteurDebit {
  private readonly horodatages: number[] = [];

  constructor(
    private readonly maxParFenetre: number,
    private readonly fenetreMs: number,
  ) {}

  async acquerir(): Promise<void> {
    for (;;) {
      const maintenant = Date.now();
      while (this.horodatages.length > 0 && maintenant - this.horodatages[0] >= this.fenetreMs) {
        this.horodatages.shift();
      }

      if (this.horodatages.length < this.maxParFenetre) {
        this.horodatages.push(maintenant);
        return;
      }

      const attenteMs = this.horodatages[0] + this.fenetreMs - maintenant;
      await new Promise<void>((resolve) => setTimeout(resolve, Math.max(attenteMs, 1)));
    }
  }
}
