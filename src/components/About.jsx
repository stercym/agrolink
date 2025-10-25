import farmer from "../assets/farmer.png"
import "./About.css"

function About() {
    return (
        <>
            <section className="about-section">
                <div className="about-content">
                    <h2>
                        <span className="about-highlight">About</span> Agrolink
                    </h2>
                    <p>
                        Agrolink empowers local farmers by giving them access to fair markets
                        and direct connections with buyers.
                    </p>
                </div>
                <div className="about-image">
                    <img src={farmer} alt="Farmer holding vegetables" />
                </div>
            </section>
        </>
    )
}

export default About;