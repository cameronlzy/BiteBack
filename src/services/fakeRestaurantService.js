export const restaurants = [
                  {
                    id: 1,
                    name: "Tonkotsu",
                    description: "Ramen",
                    address: "Tokyo",
                    imageUrl:
                      "https://images.unsplash.com/photo-1725110495313-70a0690ef110?q=80&w=2235&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
                  },
                  {
                    id: 2,
                    name: "Chez Pierre",
                    description: "French",
                    address: "Paris",
                    imageUrl:
                      "https://media.istockphoto.com/id/1257263077/vector/street-cafe-cafe-shop-in-old-french-style.jpg?s=612x612&w=0&k=20&c=FIvGiqf_bF-snNH2MHPgmU9tALusJ_Lsl0REAtoSeTc=",
                  },
                  {
                    id: 3,
                    name: "Nasi Lemak Queen",
                    description: "Local",
                    address: "Singapore",
                    imageUrl:
                      "https://media.istockphoto.com/id/1316190180/vector/asian-traditional-food-rice-with-topping-served-on-banana-leaf-and-rattan-plate-illustration.jpg?s=612x612&w=0&k=20&c=5mvp-wvfWiUs5oNL7MQdSIop608LTJfvRLogGe-WGtQ=",
                  },
                  {
                    id: 4,
                    name: "La Taquería",
                    description: "Mexican Tacos",
                    address: "Mexico City",
                    imageUrl:
                      "https://media.istockphoto.com/id/2150061638/vector/mexican-food-restaurant-vector-illustration-with-various-of-delicious-traditional-cuisine.jpg?s=612x612&w=0&k=20&c=b3grKMkvLQ21friPvlFp5Yrdn-8XW65mcSYmfIsGydo=",
                  },
                  {
                    id: 5,
                    name: "Sizzle Steakhouse",
                    description: "Grilled Steak",
                    address: "New York",
                    imageUrl:
                      "https://static.vecteezy.com/system/resources/previews/012/994/668/non_2x/steakhouse-of-grilled-meat-with-juicy-delicious-steak-salad-and-tomatoes-for-barbecue-in-flat-cartoon-hand-drawn-template-illustration-vector.jpg",
                  },
                  {
                    id: 6,
                    name: "Lotus Garden",
                    description: "Dim Sum & Chinese Cuisine",
                    address: "Hong Kong",
                    imageUrl:
                      "https://media.istockphoto.com/id/1333517344/vector/cartoon-color-chinese-restaurant-traditional-interior-inside-concept-vector.jpg?s=612x612&w=0&k=20&c=6v_bm_9oh51p6rdCWRyTGjk62nclEPGoA0yhJl3M9Fw=",
                  },
                  {
                    id: 7,
                    name: "Pane e Vino",
                    description: "Italian Trattoria",
                    address: "Rome",
                    imageUrl:
                      "https://images.unsplash.com/photo-1525755662778-989d0524087e?q=80&w=2235&auto=format&fit=crop&ixlib=rb-4.1.0",
                  },
                  {
                    id: 8,
                    name: "Coco Thai",
                    description: "Authentic Thai Cuisine",
                    address: "Bangkok",
                    imageUrl:
                      "https://t3.ftcdn.net/jpg/09/63/92/38/360_F_963923830_bz83gzNb775XKpwdJdNTRyKeCxTOzsVP.jpg",
                  },
                ];

export function getRestaurants() {
  return restaurants.filter(g => g);
}
