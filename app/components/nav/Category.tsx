"use client";

import { useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import queryString from "query-string";
import { useCallback } from "react";
import { IconType } from "react-icons";

interface CategoryProps {
  label: string;
  icon: IconType;
  selected?: boolean;
}

const Category: React.FC<CategoryProps> = ({ label, icon: Icon, selected }) => {
  const router = useRouter();
  const params = useSearchParams();

  const handleClick = useCallback(() => {
    //  checks if the label is not equal to "All". If it's not, it retrieves the current URL query parameters using useSearchParams, then parses them using queryString.parse(params.toString()):
    if (label === "All") {
      router.push("/");
    } else {
      let currentQuery = {};

      // via query-string docs
      if (params) {
        currentQuery = queryString.parse(params.toString());
      }

      // After parsing the current query parameters, the code constructs an updated query object by adding or modifying the category parameter based on the label: eg(localhost:3000/category=Phone)
      const updatedQuery: any = {
        ...currentQuery,
        category: label,
      };

      // Once the updated query object is constructed, the code uses queryString.stringifyUrl() to generate a new URL string with the updated query parameters, navigate to the newly generated URL:
      const url = queryString.stringifyUrl(
        {
          url: "/",
          query: updatedQuery,
        },
        {
          skipNull: true,
        }
      );

      router.push(url);
    }
  }, [label, params, router]);

  return (
    <div
      onClick={handleClick}
      className={`flex items-center gap-1 p-2 border-b-2 hover:text-slate-800 transition cursor-pointer ${
        selected
          ? "border-b-slate-800 text-slate-800"
          : "border-transparent text-slate-500"
      }`}
    >
      <Icon size={20} />
      <div className="font-medium text-sm">{label}</div>
    </div>
  );
};

export default Category;
