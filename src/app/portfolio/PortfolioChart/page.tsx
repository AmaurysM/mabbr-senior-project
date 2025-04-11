import PortfolioChart from "./Chart/Chart";


const PortfolioPage: React.FC = () => {
  return (
    <div className="bg-gray-800 p-1">
      <div className="max-w-7xl mx-auto">
        <section className="mb-8">
          <PortfolioChart />
        </section>
      </div>
    </div>
  );
};

export default PortfolioPage;
