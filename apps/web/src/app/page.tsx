import Link from 'next/link'

export default function Home() {
  return (
    <div className="bg-gradient-to-b from-primary-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Hero Section */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold text-gray-900 sm:text-6xl">
            Welcome to <span className="text-primary-600">FullMag</span>
          </h1>
          <p className="mt-4 text-xl text-gray-600 max-w-3xl mx-auto">
            Your one-stop shop for quality products. Multi-platform e-commerce
            system with seamless shopping experience.
          </p>
          <div className="mt-8 flex justify-center space-x-4">
            <Link
              href="/products"
              className="bg-primary-600 text-white px-8 py-3 rounded-md text-lg font-semibold hover:bg-primary-700 transition-colors"
            >
              Shop Now
            </Link>
            <Link
              href="/categories"
              className="bg-white text-primary-600 px-8 py-3 rounded-md text-lg font-semibold border-2 border-primary-600 hover:bg-primary-50 transition-colors"
            >
              Browse Categories
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold">Quality Products</h3>
              <p className="mt-2 text-gray-600">
                Curated selection of high-quality products
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold">Fast Delivery</h3>
              <p className="mt-2 text-gray-600">
                Quick and reliable shipping to your door
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                <svg
                  className="w-8 h-8 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                  />
                </svg>
              </div>
              <h3 className="mt-4 text-xl font-semibold">Secure Payments</h3>
              <p className="mt-2 text-gray-600">
                Safe and secure payment processing
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 bg-primary-600 rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold text-white">
            Ready to start shopping?
          </h2>
          <p className="mt-2 text-primary-100">
            Join thousands of satisfied customers
          </p>
          <Link
            href="/auth/register"
            className="mt-6 inline-block bg-white text-primary-600 px-8 py-3 rounded-md text-lg font-semibold hover:bg-gray-100 transition-colors"
          >
            Create an Account
          </Link>
        </div>
      </div>
    </div>
  )
}
