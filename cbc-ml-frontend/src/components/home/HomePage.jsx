import { useEffect, useRef } from "react";
import AccuracySection from "./AccuracySection";
import DetectionProcess from "./DetectionProcess";
import TeamSpecialties from "./TeamSpecialties";
import PartnersContact from "./PartnersContact";
import SiteFooter from "../footer/SiteFooter";

import "./ProcessTeamFusion.css";

export default function HomePage({ onTryNow }) {
	const heroRef = useRef(null);

	useEffect(() => {
		const hero = heroRef.current;
		if (!hero) return;

		const cells = Array.from(hero.querySelectorAll("[data-parallax-cell]"));

		const moveCells = () => {
			const heroRect = hero.getBoundingClientRect();
			const viewportH = window.innerHeight;

			const scrollProgress = Math.min(
				Math.max((0 - heroRect.top) / viewportH, 0),
				1.8
			);

			cells.forEach((cell) => {
				const speed = Number(cell.dataset.speed || 0);
				const direction = Number(cell.dataset.direction || 1);
				const xSpeed = Number(cell.dataset.xspeed || 0);

				const y = scrollProgress * speed * direction;
				const x = scrollProgress * xSpeed;

				cell.style.transform = `translate3d(${x}px, ${y}px, 0)`;
			});
		};

		moveCells();

		window.addEventListener("scroll", moveCells, { passive: true });
		window.addEventListener("resize", moveCells);

		return () => {
			window.removeEventListener("scroll", moveCells);
			window.removeEventListener("resize", moveCells);
		};
	}, []);

	return (
		<main className="cellens-page">
			<div className="home-continuous-bg" />

			<div className="home-sections">
				<section ref={heroRef} className="cellens-hero">
					<div className="hero-noise" />

					<nav className="cellens-nav">
						<button className="cellens-logo" onClick={onTryNow}>
							<span className="logo-orb">
								<span />
							</span>
							<span>CBC-XAI</span>
						</button>

						<div className="cellens-menu">
							<a>About</a>
							<a>Methodology</a>
							<a>Results</a>
						</div>

						<div className="cellens-actions">
							<button onClick={onTryNow}>Try Now</button>
							<span className="nav-icon">⌕</span>
							<span className="nav-icon">◎</span>
							<span className="nav-icon">↗</span>
						</div>
					</nav>

					<div className="hero-copy">
						<p>Welcome To CBC-XAI</p>

						<h1>
							CBC-Based
							<br />
							Blood Disease Screening
						</h1>

						<h2>
							Predict multiple hematological diseases from routine
							CBC values
							<br />
							using semi-supervised ensemble learning and
							explainable AI.
						</h2>
					</div>

					<div
						className="cell cell-left-top parallax-cell"
						data-parallax-cell
						data-speed="260"
						data-direction="-1"
						data-xspeed="-35"
					>
						<span />
					</div>

					<div
						className="cell cell-left-bottom parallax-cell"
						data-parallax-cell
						data-speed="420"
						data-direction="-1"
						data-xspeed="-55"
					>
						<span />
					</div>

					<div className="cell cell-center">
						<span />
					</div>

					<div
						className="cell cell-right-mid parallax-cell mt-4"
						data-parallax-cell
						data-speed="550"
						data-direction="-1"
						data-xspeed="85"
					>
						<span />
					</div>

					<div
						className="cell absolute cell-right-bottom parallax-cell mt-54"
						data-parallax-cell
						data-speed="320"
						data-direction="-1"
						data-xspeed="45"
					>
						<span />
					</div>

					<div className="hero-bottom-glow" />
				</section>

				<div className="process-team-fusion">
					<AccuracySection onTryNow={onTryNow} />

					<div className="accuracy-process-feather" />

					<DetectionProcess />

					<div className="process-team-feather" />

					<TeamSpecialties onTryNow={onTryNow} />

					<div className="team-partners-feather" />

					<PartnersContact />
					<SiteFooter />
				</div>
			</div>
		</main>
	);
}
