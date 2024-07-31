import prisma from "@/libs/prismadb";

export default async function getUsers() {
  try {
    // const users = prisma.user.findMany();
    const users = prisma.user.count();

    return users;
  } catch (error: any) {
    throw new Error(error);
  }
}
