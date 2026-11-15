import {products} from "../data/profile";
import {ExternalLink, SectionHeading} from "./ui";

export function Products() {
  return (
    <section
      id="products"
      className="wrap section"
      aria-labelledby="products-title"
    >
      <SectionHeading
        id="products-title"
        title="Products"
        intro="Platforms and apps I have built or helped build, for clients in Australia, the United States and Pakistan."
      />

      <ul className="border-t border-ink">
        {products.map(product => (
          <li
            key={product.id}
            id={product.id}
            className="grid scroll-mt-24 gap-x-10 gap-y-3 border-b border-line py-8 lg:grid-cols-12 lg:py-10"
          >
            <div className="lg:col-span-4">
              <h3 className="t-h3">{product.name}</h3>
            </div>
            <div className="lg:col-span-5">
              <p className="font-semibold">
                {product.kind}
                {product.region && (
                  <span className="font-normal text-ink-soft">
                    , {product.region}
                  </span>
                )}
              </p>
              <p className="mt-2 text-ink-soft">{product.description}</p>
            </div>
            <ul className="space-y-1 lg:col-span-3 lg:justify-self-end lg:text-right">
              {product.links.map(link => (
                <li key={link.href}>
                  <ExternalLink href={link.href} className="link font-semibold">
                    {link.label}
                  </ExternalLink>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </section>
  );
}
