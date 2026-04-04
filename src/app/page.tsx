import Hero from "@/components/home/Hero";
import UseCases from "@/components/home/UseCases";
import Categories from "@/components/home/Categories";
import Trending from "@/components/home/Trending";
import Benchmarks from "@/components/home/Benchmarks";
import News from "@/components/home/News";
import ProSection from "@/components/home/ProSection";
import Footer from "@/components/Footer";
import prisma from "@/lib/db";
import { Category, Tool } from "@prisma/client";

export default async function Home() {
  // Fetch dynamic data from the database
  let categories: Category[] = [];
  let trendingTools: Tool[] = [];
  let error = null;

  try {
    categories = await prisma.category.findMany();
    trendingTools = await prisma.tool.findMany({
      take: 6,
      orderBy: { ratingOverall: "desc" },
    });
  } catch (e) {
    console.error("Database connection failed during build/render:", e);
    // Graceful fallback handles empty arrays downstream
  }

  return (
    <>
      <Hero />
      <UseCases />
      <Categories categories={categories} />
      <Trending tools={trendingTools} />
      <Benchmarks />
      <News />
      <ProSection />
      <Footer />
    </>
  );
}
