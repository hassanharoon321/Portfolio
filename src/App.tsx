import {useEffect} from "react";
import {About} from "./components/About";
import {AiSystems} from "./components/AiSystems";
import {Contact} from "./components/Contact";
import {Disciplines} from "./components/Disciplines";
import {Experience} from "./components/Experience";
import {Footer} from "./components/Footer";
import {Header} from "./components/Header";
import {Hero} from "./components/Hero";
import {Products} from "./components/Products";

export default function App() {
  // The sections only exist once React has rendered, so the browser's own jump to a link such
  // as /#contact can miss. Make the jump once, after the first render.
  useEffect(() => {
    const id = decodeURIComponent(window.location.hash.slice(1));
    if (id) document.getElementById(id)?.scrollIntoView({behavior: "instant"});
  }, []);

  return (
    <>
      <Header />
      <main id="main">
        <Hero />
        <Disciplines />
        <AiSystems />
        <Products />
        <Experience />
        <About />
        <Contact />
      </main>
      <Footer />
    </>
  );
}
