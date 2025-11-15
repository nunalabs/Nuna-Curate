import { Wallet, Upload, ShoppingCart, Sparkles } from 'lucide-react';

const steps = [
  {
    icon: Wallet,
    title: 'Connect Your Wallet',
    description: 'Set up your Stellar wallet and connect it to Nuna Curate in seconds.',
  },
  {
    icon: Upload,
    title: 'Create Your NFT',
    description: 'Upload your artwork, add details, and mint your NFT on Stellar.',
  },
  {
    icon: ShoppingCart,
    title: 'List for Sale',
    description: 'Set your price and list your NFT on our marketplace.',
  },
  {
    icon: Sparkles,
    title: 'Earn Royalties',
    description: 'Earn automatic royalties on every future sale of your NFT.',
  },
];

export function HowItWorks() {
  return (
    <section className="border-t py-16 md:py-24">
      <div className="container">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            How It Works
          </h2>
          <p className="mt-2 text-muted-foreground">
            Create and sell NFTs in four simple steps
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <div key={step.title} className="relative text-center">
              {index < steps.length - 1 && (
                <div className="absolute left-1/2 top-12 hidden h-px w-full bg-border lg:block" />
              )}
              <div className="relative z-10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <step.icon className="h-8 w-8 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold">{step.title}</h3>
              <p className="text-sm text-muted-foreground">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
