import NlpSearch from "@/components/home/NlpSearch";
import Categories from "@/components/home/Categories";
import Footer from "@/components/Footer";
import prisma from "@/lib/db";
import { Category } from "@prisma/client";

export const dynamic = "force-dynamic";

export default async function Home() {
  let categories: Category[] = [];

  try {
    categories = await prisma.category.findMany({
      where: {
        toolCount: {
          gt: 0,
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        toolCount: true,
        sortOrder: true,
        color: true,
        icon: true,
      },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    }) as Category[];
  } catch (e) {
    console.error("Database connection failed during build/render:", e);
  }

  return (
    <>
      <NlpSearch />
      <Categories categories={categories} />
      <Footer />
    </>
  );
}
