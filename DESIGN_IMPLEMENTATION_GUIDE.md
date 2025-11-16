# 🎨 GUÍA DE IMPLEMENTACIÓN - DISEÑO MUSEO

**Cómo usar el nuevo sistema de diseño de Nuna Curate**

---

## ✅ **LO QUE SE IMPLEMENTÓ**

1. ✅ Paleta de colores institucional en Tailwind
2. ✅ Sistema de colores CSS variables
3. ✅ Componentes UI estilo museo
4. ✅ Animaciones elegantes
5. ✅ Tipografía profesional
6. ✅ Gradientes institucionales
7. ✅ Efectos especiales (glow, shimmer, float)

---

## 🎨 **PALETA DE COLORES - USO PRÁCTICO**

### Purple Royal (Principal - 40-45%)
```jsx
// Backgrounds y branding
<div className="bg-museum-purple-500">Purple Royal</div>
<div className="bg-museum-gradient">Gradiente Museo</div>

// Text
<h1 className="text-museum-purple-500">Título</h1>

// Borders
<div className="border-2 border-museum-purple-500">Card</div>
```

### Golden Amber (Secundario - 20-25%)
```jsx
// Acentos premium
<span className="text-museum-gold-500">Premium</span>
<div className="border-museum-gold-500">Marco Dorado</div>

// Badges
<span className="badge-premium">✨ Featured</span>

// Sombras doradas
<div className="shadow-gold">Destacado</div>
```

### Crimson Red (Acción - 10-15%)
```jsx
// CTAs principales
<button className="cta-primary">Comprar Ahora</button>
<button className="bg-museum-red-500">Urgent Action</button>

// Indicadores
<span className="text-museum-red-500">En Vivo</span>
```

### Coral Orange (Interacción - 15-20%)
```jsx
// CTAs secundarios
<button className="cta-secondary">Explorar</button>
<button className="bg-museum-orange-500">Ver Más</button>

// Estados hover
<div className="hover:border-museum-orange-500">Interactive</div>
```

---

## 🏛️ **COMPONENTES MUSEO**

### 1. Card NFT (Museum Card)
```jsx
import Image from 'next/image';

export function NFTCard({ nft }) {
  return (
    <div className="nft-card">
      {/* Imagen con zoom al hover */}
      <div className="nft-card-image">
        <Image
          src={nft.image}
          alt={nft.name}
          fill
          className="object-cover"
        />
      </div>

      {/* Contenido */}
      <div className="p-6 space-y-4">
        <h3 className="font-display text-2xl text-museum-purple-500">
          {nft.name}
        </h3>

        <p className="text-muted-foreground">
          Por {nft.artist}
        </p>

        {/* Precio con golden highlight */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Precio</span>
          <span className="text-xl font-bold text-museum-gold-500">
            {nft.price} XLM
          </span>
        </div>

        {/* CTA */}
        <button className="cta-secondary w-full">
          Ver Detalles
        </button>
      </div>
    </div>
  );
}
```

### 2. Hero Section (Museo)
```jsx
export function HeroMuseum() {
  return (
    <section className="hero-museum">
      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Título con animación */}
          <h1 className="font-display text-6xl md:text-8xl animate-fade-in-up">
            Bienvenido al Museo
            <span className="block text-gradient-museum">
              Digital de Arte NFT
            </span>
          </h1>

          {/* Descripción */}
          <p className="text-xl md:text-2xl text-white/90 animate-fade-in-up animation-delay-200">
            Explora, colecciona y posee obras de arte únicas en Stellar
          </p>

          {/* CTAs */}
          <div className="flex gap-4 justify-center animate-fade-in-up animation-delay-400">
            <button className="cta-primary">
              Explorar Colección
            </button>
            <button className="cta-secondary">
              Crear NFT
            </button>
          </div>
        </div>
      </div>

      {/* Decoración flotante */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-museum-gold-500/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-museum-purple-400/20 rounded-full blur-3xl animate-float animation-delay-1000" />
      </div>
    </section>
  );
}
```

### 3. NFT Grid (Galería)
```jsx
export function NFTGallery({ nfts }) {
  return (
    <section className="container py-24 museum-spacing">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h2 className="font-display text-5xl mb-6">
          <span className="text-gradient-museum">
            Obras Destacadas
          </span>
        </h2>
        <p className="text-xl text-muted-foreground">
          Explora nuestra selección curada de arte digital excepcional
        </p>
      </div>

      {/* Separador decorativo */}
      <div className="museum-divider" />

      {/* Grid con espaciado museo */}
      <div className="museum-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {nfts.map((nft) => (
          <NFTCard key={nft.id} nft={nft} />
        ))}
      </div>
    </section>
  );
}
```

### 4. NFT Premium (Con Marco Dorado)
```jsx
export function PremiumNFT({ nft }) {
  return (
    <div className="nft-card golden-frame">
      {/* Badge Premium */}
      <div className="absolute top-4 right-4 z-10">
        <span className="badge-premium">
          ✨ Premium
        </span>
      </div>

      {/* Resto del contenido igual que NFTCard */}
      {/* ... */}
    </div>
  );
}
```

### 5. Loading State (Shimmer Museo)
```jsx
export function NFTCardSkeleton() {
  return (
    <div className="museum-card">
      {/* Imagen placeholder */}
      <div className="aspect-square shimmer-museum rounded-t-xl" />

      {/* Contenido placeholder */}
      <div className="p-6 space-y-4">
        <div className="h-8 shimmer-museum rounded" />
        <div className="h-4 shimmer-museum rounded w-2/3" />
        <div className="h-12 shimmer-museum rounded" />
      </div>
    </div>
  );
}
```

---

## 🎭 **ANIMACIONES**

### Fade In Up (Entrada elegante)
```jsx
<div className="animate-fade-in-up">
  Aparece desde abajo
</div>
```

### Zoom In (Énfasis)
```jsx
<div className="animate-zoom-in">
  Zoom suave
</div>
```

### Float (Elemento flotante)
```jsx
<div className="animate-float">
  Flotando suavemente
</div>
```

### Glow (Brillo pulsante)
```jsx
<div className="animate-glow">
  Efecto de brillo
</div>

// O con clases estáticas:
<div className="glow-purple">Brillo púrpura</div>
<div className="glow-gold">Brillo dorado</div>
```

---

## 🎨 **GRADIENTES**

### Gradiente Museo (Purple)
```jsx
<div className="bg-museum-gradient">
  Fondo púrpura degradado
</div>
```

### Gradiente Golden Hour
```jsx
<div className="bg-golden-hour text-white">
  Gold → Orange
</div>
```

### Gradiente Majestuoso (Full palette)
```jsx
<div className="bg-majestic text-white">
  Purple → Gold → Orange
</div>
```

### Text Gradient
```jsx
<h1 className="text-gradient-museum text-6xl">
  Título con gradiente
</h1>

<h2 className="text-gradient-gold text-4xl">
  Gradiente dorado
</h2>
```

---

## ✨ **EFECTOS ESPECIALES**

### Glass Effect (Glassmorphism)
```jsx
<div className="glass-museum p-8 rounded-xl">
  <p>Efecto cristal museo</p>
</div>
```

### Sombras Museo
```jsx
<div className="shadow-museum">Sombra normal</div>
<div className="shadow-museum-lg">Sombra grande</div>
<div className="shadow-gold">Sombra dorada</div>
<div className="shadow-gold-lg">Sombra dorada grande</div>
```

### Separador Decorativo
```jsx
<div className="museum-divider" />
```

---

## 📱 **RESPONSIVE**

### Espaciado Museo (Automático)
```jsx
<div className="museum-spacing">
  {/* Los elementos hijos tendrán espacio generoso */}
  <Section1 />
  <Section2 />
  <Section3 />
</div>
```

### Grid Museo
```jsx
<div className="museum-grid grid-cols-1 md:grid-cols-3">
  {/* Grid con gaps generosos tipo museo */}
</div>
```

---

## 🌙 **MODO OSCURO**

El tema oscuro (Galería Nocturna) es **automático**:

```jsx
// En tu layout principal:
<html className="dark">
  {/* Todo el sitio en modo oscuro */}
</html>

// O toggle manual:
<button onClick={() => document.documentElement.classList.toggle('dark')}>
  Cambiar Tema
</button>
```

---

## 🎯 **BOTONES & CTAs**

### CTA Principal (Crimson Red)
```jsx
<button className="cta-primary">
  Comprar Ahora
</button>
```

### CTA Secundario (Coral Orange)
```jsx
<button className="cta-secondary">
  Explorar Más
</button>
```

### Badge Premium
```jsx
<span className="badge-premium">
  ✨ Featured
</span>
```

---

## 🎨 **EJEMPLO COMPLETO: Página de NFT**

```jsx
export default function NFTPage({ nft }) {
  return (
    <div className="min-h-screen">
      {/* Hero con background museo */}
      <section className="bg-museum-dark py-24">
        <div className="container">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Imagen NFT */}
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden golden-frame glow-purple">
                <Image
                  src={nft.image}
                  alt={nft.name}
                  fill
                  className="object-cover"
                />
              </div>

              {/* Badge Premium si aplica */}
              {nft.isPremium && (
                <div className="absolute top-4 right-4">
                  <span className="badge-premium">
                    ✨ Premium
                  </span>
                </div>
              )}
            </div>

            {/* Información */}
            <div className="space-y-8">
              {/* Título */}
              <h1 className="font-display text-5xl md:text-7xl">
                <span className="text-gradient-museum">
                  {nft.name}
                </span>
              </h1>

              {/* Artista */}
              <div className="flex items-center gap-4">
                <Image
                  src={nft.artist.avatar}
                  alt={nft.artist.name}
                  width={48}
                  height={48}
                  className="rounded-full"
                />
                <div>
                  <p className="text-sm text-muted-foreground">Artista</p>
                  <p className="font-semibold text-museum-purple-500">
                    {nft.artist.name}
                  </p>
                </div>
              </div>

              {/* Separador */}
              <div className="museum-divider" />

              {/* Descripción */}
              <p className="text-lg text-foreground/80">
                {nft.description}
              </p>

              {/* Precio */}
              <div className="glass-museum p-6 rounded-xl">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Precio Actual</span>
                  <span className="text-3xl font-bold text-museum-gold-500">
                    {nft.price} XLM
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="flex gap-4">
                <button className="cta-primary flex-1">
                  Comprar Ahora
                </button>
                <button className="cta-secondary">
                  Hacer Oferta
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Más NFTs del artista */}
      <section className="container py-24 museum-spacing">
        <h2 className="font-display text-4xl mb-12">
          <span className="text-gradient-gold">
            Más de {nft.artist.name}
          </span>
        </h2>

        <div className="museum-grid grid-cols-1 md:grid-cols-3">
          {/* NFTs relacionados */}
        </div>
      </section>
    </div>
  );
}
```

---

## 🚀 **PRÓXIMOS PASOS**

1. ✅ Aplicar `nft-card` a componentes existentes
2. ✅ Usar `cta-primary` y `cta-secondary` en botones
3. ✅ Agregar `badge-premium` a NFTs destacados
4. ✅ Implementar `hero-museum` en homepage
5. ✅ Usar `museum-grid` para galerías
6. ✅ Agregar animaciones `fade-in-up` a elementos
7. ✅ Aplicar `text-gradient-museum` a títulos principales

---

## 📊 **ANTES vs DESPUÉS**

### ANTES:
```jsx
<div className="bg-white p-4 rounded shadow">
  <img src={nft.image} />
  <h3>{nft.name}</h3>
  <button>Buy</button>
</div>
```

### DESPUÉS (Museo):
```jsx
<div className="nft-card">
  <div className="nft-card-image">
    <Image src={nft.image} fill />
  </div>
  <div className="p-6">
    <h3 className="font-display text-2xl text-gradient-museum">
      {nft.name}
    </h3>
    <button className="cta-primary w-full">
      Comprar Ahora
    </button>
  </div>
</div>
```

---

**Sistema de diseño listo para usar!** 🎨

Todos los componentes están disponibles y puedes empezar a usarlos inmediatamente.
