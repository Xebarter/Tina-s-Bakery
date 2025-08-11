import { useApp } from '../contexts/AppContext';

export function AboutPage() {
  const { state } = useApp();
  
  // Default content to show while loading or if no content is available
  const defaultContent = {
    id: 'default',
    title: 'Our Story',
    content: 'Welcome to our bakery. We are passionate about creating delicious baked goods with the finest ingredients.',
    images: ['https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg'],
    created_at: new Date().toISOString(),
    last_modified: new Date().toISOString()
  };

  // Use content from state or fallback to default
  const content = state.aboutContent || defaultContent;

  const team = [
    {
      name: 'Tina Rodriguez',
      role: 'Founder & Head Baker',
      image: 'https://images.pexels.com/photos/1043471/pexels-photo-1043471.jpeg',
    },
    {
      name: 'Marco Rodriguez',
      role: 'Pastry Chef',
      image: 'https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg',
    },
    {
      name: 'Sarah Chen',
      role: 'Cake Designer',
      image: 'https://images.pexels.com/photos/1043473/pexels-photo-1043473.jpeg',
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        {/* Our Story Section */}
        <div className="grid md:grid-cols-2 gap-16 items-center mb-24">
          <div className="order-2 md:order-1">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">{content.title}</h1>
            <p className="text-lg text-gray-600 mb-6 whitespace-pre-line">
              {content.content}
            </p>
          </div>
          <div className="order-1 md:order-2">
            <img
              src={content.images[0]}
              alt="Inside Tina's Bakery"
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
          {team.map((member, index) => (
            <div key={index} className="text-center">
              <img
                src={member.image}
                alt={member.name}
                className="w-48 h-48 mx-auto rounded-full shadow-lg mb-4"
              />
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