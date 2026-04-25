import { useParams } from "react-router-dom";

const ProductDetailsPage = () => {
  const { id } = useParams();

  return (
    <section className="page">
      <h1>Product Details</h1>
      <p>Viewing product: {id}</p>
    </section>
  );
};

export default ProductDetailsPage;
