import { User } from "@prisma/client";

//  the SafeUser type is a variation of the User type with some properties omitted and others modified to ensure that certain properties are represented as strings(SafeUser is defined by omitting the properties "createdAt", "updatedAt", and "emailVerified" from the User type using Omit. It then adds these properties back with a type change, specifying that they should be of type string.)
export type SafeUser = Omit<
  User,
  "createdAt" | "updateAt" | "emailVerified"
> & { createdAt: string; updateAt: string; emailVerified: string | null };
