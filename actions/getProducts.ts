import prisma from "@/libs/prismadb";

export interface IProductParams {
  category?: string | null;
  searchTerm?: string | null;
}

export default async function getProducts(params: IProductParams) {
  try {
    const { category, searchTerm } = params;
    let searchString = searchTerm;

    if (!searchTerm) {
      searchString = "";
    }

    // let query: any = {};: This initializes an empty object query, which will be used to construct the Prisma query for fetching products.
    let query: any = {};

    if (category) {
      query.category = category;
    }

    // const products = await prisma.product.findMany({ ... });: This line queries the database using Prisma's findMany method to retrieve products based on the specified criteria. It includes a where clause to filter products based on the query object (including category) and a search string using a case-insensitive search on the name and description fields.
    const products = await prisma.product.findMany({
      where: {
        ...query,
        OR: [
          {
            name: {
              contains: searchString,
              mode: "insensitive",
            },
            description: {
              contains: searchString,
              mode: "insensitive",
            },
          },
        ],
      },
      include: {
        reviews: {
          include: {
            user: true,
          },
          orderBy: {
            createdDate: "desc",
          },
        },
      },
    });

    return products;
  } catch (error: any) {
    throw new Error(error);
  }
}
