import bag1 from "../Images/bag1.jpg";
import bag2 from "../Images/bag2.jpg";
import bag3 from "../Images/bag3.jpg";
import fashion1 from "../Images/fashion1.jpg";
import fashion2 from "../Images/fashion2.jpg";
import fashion3 from "../Images/fashion3.jpg";



const productData = [
    {
      id: "1",
      category: 'bags',
      name:  `Tote bag`,
      description:
       "Tote bags are large, open-top bags with parallel handles that emerge from the sides of the bag. They are spacious and versatile, suitable for everyday use, work, or travel",
      image: bag1,
      price: 30.99,
      quantity: 1,
    },

    {
      id: "2",
      category: 'bags',
      name: `Shoulder bag`,
      description:
       "Shoulder bags have a single strap that can be worn over the shoulder. They come in various sizes and styles, making them suitable for both casual and formal occasions",
      image: bag2,
      price: 34.88,
      quantity: 1,
    },
    {
      id: "3",
      category: 'bags',
      name: `Crossbody bag`,
      description:
      "Crossbody bags have a long strap that is worn diagonally across the body. They are hands-free and convenient, making them great for activities where you need freedom of movement",
      image: bag3,
      price: 40.0,
      quantity: 1,
    },
    {
      id: "4",
      category: `fashion`,
      name: "Sweater Top",
      description:'This is a kind of garment,usually worn ver the uppper body that is knitted',
      image: fashion1,
      price: 40.0,
      quantity: 1,

    },
    {
      id: "5",
      name: `Booty short`,
      category: 'fashion',
      description:'This is a a style of shorts that are characterized by their short length, typically exposing a significant portion of the buttocks. These shorts are designed to be tight-fitting and are often associated with athletic or casual wear',
      image: fashion2,
      price: 40.0,
      quantity: 1,
    },
    {
      id: "6",
      name: `T-shirt`,
      category: 'fashion',
      description:'A T-shirt is a style of shirt characterized by its T-shaped body and short sleeves. It is a versatile and popular piece of casual clothing that can be worn by people of all ages and genders',
      image: fashion3,
      price: 40.0,
      quantity: 1,
    },
  ];

  export default productData;