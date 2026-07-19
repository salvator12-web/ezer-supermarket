import Hero from '../components/home/Hero.jsx';
import StatsBar from '../components/home/StatsBar.jsx';
import HowItWorks from '../components/home/HowItWorks.jsx';
import FeaturedProducts from '../components/home/FeaturedProducts.jsx';

export default function Home() {
  return (
    <>
      <Hero />
      <StatsBar />
      <HowItWorks />
      <FeaturedProducts />
    </>
  );
}
