import { LandingHeader } from "@/components/landing-header";

export default function Home() {
  return (
    <div className="landing-page min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#0f0f0f] to-[#0a0a0a]">
      <LandingHeader />

      <main className="pt-16">
        <section className="relative overflow-hidden px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="text-center">
              <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight">
                The POS System That <br />
                <span className="bg-gradient-to-r from-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Grows Your Business
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-gray-500 mb-8 max-w-3xl mx-auto">
                Accept payments, track inventory, and manage your entire
                business from one powerful platform
              </p>
              <div className="flex gap-4 justify-center mb-8">
                <button className="bg-white text-black px-8 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors duration-200">
                  Get Started
                </button>
                <button className="border border-white/20 text-white px-8 py-3 rounded-lg font-medium hover:bg-white/10 transition-colors duration-200">
                  Learn More
                </button>
              </div>

              <div className="flex flex-col items-center gap-4 mb-16">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">Trusted by</span>
                  <span className="text-white font-semibold">10,000+</span>
                  <span className="text-gray-500 text-sm">businesses</span>
                </div>
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg
                      key={i}
                      className="w-5 h-5 text-yellow-500 fill-current"
                      viewBox="0 0 20 20"
                    >
                      <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                    </svg>
                  ))}
                  <span className="text-gray-500 text-sm ml-2">
                    4.9/5 rating
                  </span>
                </div>
              </div>

              <div className="mt-12 max-w-5xl mx-auto">
                <div className="bg-gradient-to-b from-white/10 to-white/5 rounded-xl p-1">
                  <div className="bg-black/50 rounded-lg h-[500px] flex items-center justify-center">
                    <span className="text-gray-600 text-lg">
                      TIP Dashboard Preview
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
              Everything You Need to Run Your Business
            </h2>
            <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
              Simple, powerful tools designed for modern retail and restaurant
              businesses
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all duration-200">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Payment Processing
                </h3>
                <p className="text-gray-500">
                  Accept all major cards, mobile wallets, and contactless
                  payments with low fees
                </p>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all duration-200">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Inventory Management
                </h3>
                <p className="text-gray-500">
                  Track stock levels in real-time, set alerts, and manage
                  suppliers effortlessly
                </p>
              </div>
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 border border-white/5 hover:border-white/10 transition-all duration-200">
                <div className="w-12 h-12 bg-green-500/10 rounded-lg flex items-center justify-center mb-4">
                  <svg
                    className="w-6 h-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold text-white mb-3">
                  Analytics & Reports
                </h3>
                <p className="text-gray-500">
                  Get insights into sales trends, customer behavior, and
                  business performance
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="solution" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  Built for Your Success
                </h2>
                <p className="text-gray-500 mb-8">
                  Whether you run a coffee shop, boutique, or restaurant chain,
                  TIP scales with your ambitions. Our cloud-based system ensures
                  you&apos;re always running the latest features with zero
                  downtime.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">
                        Set up in minutes
                      </h4>
                      <p className="text-gray-500 text-sm">
                        No complex installations. Start accepting payments
                        immediately
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">
                        Works offline
                      </h4>
                      <p className="text-gray-500 text-sm">
                        Never lose a sale. Process transactions even without
                        internet
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <svg
                        className="w-4 h-4 text-green-500"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-white font-medium mb-1">
                        24/7 support
                      </h4>
                      <p className="text-gray-500 text-sm">
                        Get help whenever you need it from our expert team
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl h-96 flex items-center justify-center border border-white/5">
                <span className="text-gray-600">
                  Analytics Dashboard Preview
                </span>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 text-center">
              Simple, Transparent Pricing
            </h2>
            <p className="text-gray-500 text-center mb-12 max-w-2xl mx-auto">
              No hidden fees. No surprises. Just honest pricing that grows with
              your business.
            </p>
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-white/5 hover:border-white/10 transition-all duration-200">
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Essential
                </h3>
                <p className="text-gray-500 mb-6">
                  Perfect for small businesses
                </p>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-white">$29</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">
                      Basic POS features
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">
                      Up to 1,000 products
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">Basic reports</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">Email support</span>
                  </li>
                </ul>
                <button className="w-full border border-white/10 text-white py-3 rounded-lg hover:bg-white/5 transition-colors duration-200 font-medium">
                  Start Free Trial
                </button>
              </div>

              <div className="bg-gradient-to-b from-green-500/5 to-transparent backdrop-blur-sm rounded-xl p-8 border border-green-500/30 relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-black text-sm px-4 py-1.5 rounded-full font-medium">
                    Most Popular
                  </span>
                </div>
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Professional
                </h3>
                <p className="text-gray-500 mb-6">For growing businesses</p>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-white">$79</span>
                  <span className="text-gray-500">/month</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">
                      Everything in Essential
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">
                      Unlimited products
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">
                      Advanced analytics
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">
                      Multi-location support
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">
                      Priority support
                    </span>
                  </li>
                </ul>
                <button className="w-full bg-white text-black py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 font-medium">
                  Start Free Trial
                </button>
              </div>

              <div className="bg-black/30 backdrop-blur-sm rounded-xl p-8 border border-white/5 hover:border-white/10 transition-all duration-200">
                <h3 className="text-2xl font-semibold text-white mb-2">
                  Enterprise
                </h3>
                <p className="text-gray-500 mb-6">For large operations</p>
                <div className="mb-8">
                  <span className="text-5xl font-bold text-white">Custom</span>
                </div>
                <ul className="space-y-4 mb-8">
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">
                      Everything in Professional
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">
                      Custom integrations
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">
                      Dedicated account manager
                    </span>
                  </li>
                  <li className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-gray-400 text-sm">SLA guarantee</span>
                  </li>
                </ul>
                <button className="w-full border border-white/10 text-white py-3 rounded-lg hover:bg-white/5 transition-colors duration-200 font-medium">
                  Contact Sales
                </button>
              </div>
            </div>
          </div>
        </section>

        <footer className="px-4 py-12 sm:px-6 lg:px-8 border-t border-white/10">
          <div className="max-w-7xl mx-auto text-center">
            <p className="text-gray-400">© 2024 TIP. All rights reserved.</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
