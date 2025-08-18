export function AboutPage() {
  // Static content for the about page
  const content = {
    title: "Our Story",
    description: "Welcome to Tina's Bakery, where passion meets perfection in every bite. For over a decade, we've been crafting artisanal baked goods using only the finest ingredients and traditional techniques.",
    image: "/images/bakery-interior.jpg",
    team: [
      {
        name: "Tina Mbabazi",
        role: "Head Baker & Owner",
        image: "/images/tina.jpg"
      },
      {
        name: "James Kato",
        role: "Pastry Chef",
        image: "/images/james.jpg"
      },
      {
        name: "Sarah Nalwoga",
        role: "Cake Decorator",
        image: "/images/sarah.jpg"
      }
    ]
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Our Story Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div className="order-2 md:order-1">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{content.title}</h1>
            <p className="text-lg text-gray-600 mb-6">
              {content.description}
            </p>
            <p className="text-lg text-gray-600 mb-6">
              Our journey began with a simple dream: to bring the authentic taste of homemade baked goods to our community. Every recipe is crafted with love, using locally-sourced ingredients whenever possible.
            </p>
          </div>
          <div className="order-1 md:order-2">
            <img
              src={content.image}
              alt="Tina's Bakery interior"
              className="rounded-lg shadow-xl w-full h-auto object-cover"
            />
          </div>
        </div>

        {/* Meet the Team Section */}
        <div className="text-center mb-24">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Meet the Team</h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            The talented and passionate individuals who make Tina's Bakery special.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {content.team.map((member, index) => (
            <div key={`${member.name}-${index}`} className="text-center">
              <div className="w-48 h-48 mx-auto rounded-full bg-gray-200 mb-4 overflow-hidden">
                <img
                  src={member.image}
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-bold text-gray-900">{member.name}</h3>
              <p className="text-md text-amber-600 font-semibold">{member.role}</p>
            </div>
          ))}
        </div>

        {/* Contact Us Section */}
        <div className="bg-amber-100 rounded-lg p-12 mt-24 text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 mb-4">Have a Question?</h2>
          <p className="text-xl text-gray-600 mb-8">
            We'd love to hear from you. Whether it's a custom cake inquiry or a question about our menu, feel free to reach out.
          </p>
          <a
            href="/contact"
            className="inline-block bg-amber-600 text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-amber-700 transition-colors"
          >
            Contact Us
          </a>
        </div>
      </main>
    </div>
  );
}