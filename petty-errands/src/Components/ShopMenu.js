import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { db } from "../Config/firebaseConfig";
import noImage from "../Images/noImage.png";
import Categories from "./Categories";

function ShopMenu() {
  const [categories, setCategories] = useState([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoriesSnapshot = await db.collection("Products").get();
        let categoriesMap = {}; // Use an object to map category names to details

        categoriesSnapshot.docs.forEach((doc) => {
          const data = doc.data();
          // Check if the category already has an image; if not, set the first one encountered
          if (!categoriesMap[data.ProductCategory]) {
            categoriesMap[data.ProductCategory] = {
              category_name: data.ProductCategory,
              image_url: data.ProductImg[0].url || noImage, // Use first image found or a default image
            };
          }
        });

        // Convert the object back to an array for rendering
        const categoriesArray = Object.keys(categoriesMap).map(
          (categoryName, index) => ({
            category_id: index + 1,
            category_name: categoryName,
            image_url: categoriesMap[categoryName].image_url,
          })
        );

        setCategories(categoriesArray);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };

    fetchCategories();
  }, []);

  const handleCategorySelect = (categoryId) => {
    setSelectedCategoryId(categoryId);
  };

  return (
    <div className="container mx-auto p-4">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {categories.map((category) => (
          <div
            key={category.category_id}
            className="flex flex-col items-center border border-gray-200 rounded shadow-lg transition-shadow hover:shadow-xl bg-white"
          >
            <img
              src={category.image_url}
              alt={category.category_name}
              className="w-full h-36 object-contain mt-4"
              onError={(e) => {
                e.target.src = noImage;
              }}
            />
            <div className="flex-grow flex flex-col justify-between w-full">
              <Link
                to={`/category/${category.category_name}`}
                className="flex-grow"
              >
                <div className="bg-teal-700 text-white p-2 text-center rounded whitespace-nowrap w-full hover:bg-teal-900 transition-colors mt-4">
                  <button
                    onClick={() => handleCategorySelect(category.category_name)}
                    className="hover:opacity-75 cursor-pointer text-xl w-full"
                  >
                    {category.category_name}
                  </button>
                </div>
              </Link>
            </div>
          </div>
        ))}
      </div>
      {selectedCategoryId && (
        <Categories
          category={categories.find(
            (cat) => cat.category_id === selectedCategoryId
          )}
        />
      )}
    </div>
  );
}

export default ShopMenu;