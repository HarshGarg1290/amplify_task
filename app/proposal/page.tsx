import Navigation from "../components/Navigation";
import { FaRegClock } from "react-icons/fa6";
import { IoDocumentTextOutline } from "react-icons/io5";
import { LuShield } from "react-icons/lu";
import { CiCalendar } from "react-icons/ci";
import { TfiArrowTopRight } from "react-icons/tfi";
import { IoIosArrowDown } from "react-icons/io";
import { CiChat1 } from "react-icons/ci";
import { TiTick } from "react-icons/ti";
import { ImArrowDown } from "react-icons/im";
import { GoChecklist } from "react-icons/go";
import { HiOutlineWrenchScrewdriver } from "react-icons/hi2";
import { IoIosLink } from "react-icons/io";
import { GiGraduateCap } from "react-icons/gi";
const lineItems = [
	{
		item: "Pathology Scanner SG300",
		description:
			"Digitizes glass slides into high-resolution digital images. Throughput: 400 slides/day.",
		qty: 2,
		listPrice: "$520,000",
		discount: "12%",
		netPrice: "$457,600",
	},
	{
		item: "IMS 4.x License (per SG300)",
		description:
			"Enables image storage, viewing, and system operation. Includes 3-yr maintenance.",
		qty: 2,
		listPrice: "$180,000",
		discount: "15%",
		netPrice: "$153,000",
	},
	{
		item: "Add.IMS Instance (None Scanning)",
		description:
			"Enables image storage, viewing, and system operation for read-only nodes.",
		qty: 1,
		listPrice: "$68,000",
		discount: "10%",
		netPrice: "$61,200",
	},
	{
		item: "IMS Test Configuration",
		description:
			"Dedicated test environment for validation, upgrades, and training workflows.",
		qty: 1,
		listPrice: "$42,000",
		discount: "10%",
		netPrice: "$37,800",
	},
	{
		item: "IMS5 Configuration",
		description:
			"Next-generation IMS enabling AI-assist, advanced analytics, and audit logging.",
		qty: 1,
		listPrice: "$95,000",
		discount: "18%",
		netPrice: "$77,900",
	},
	{
		item: "Management Configuration",
		description:
			"Centralized system configuration for optimal multi-site workflow management.",
		qty: 1,
		listPrice: "$38,500",
		discount: "10%",
		netPrice: "$34,650",
	},
];

const professionalServices = [
	{
		title: " System Integration & LIS Connectivity",
		description:
			"Full integration with existing Laboratory Information Systems (LIS/LIMS), HL7 interface configuration and workflow validation.",
		netPrice: "$185,000",
		listPrice: "$215,000",
	},
	{
		title: "Installation & Go-Live Support",
		description:
			"On-site hardware installation, network configuration, system validation, and dedicated go-live support for 30 days.",
		netPrice: "$62,000",
		listPrice: "$75,000",
	},
	{
		title: "End-User Training Program",
		description:
			"Comprehensive role-based training for pathologists, lab technicians, and IT staff. Includes training materials and recorded sessions.",
		netPrice: "$38,000",
		listPrice: "$45,000",
	},
	{
		title: "3-Year Premium Support & SLA",
		description:
			"Priority remote support (4hr response), annual preventative maintenance visits, software updates included, and dedicated CSM.",
		netPrice: "$96,045",
		listPrice: "$116,500",
	},
	{
		title: "Cloud Storage Setup & Migration",
		description:
			"Configuration of cloud image repository, initial data migration from legacy archives, and DR/backup policy setup.",
		netPrice: "$48,000",
		listPrice: "$58,000",
	},
	{
		title: "Project Management",
		description:
			"Dedicated PM for end-to-end deployment coordination, milestone tracking, stakeholder reporting, and risk management.",
		netPrice: "$28,000",
		listPrice: "$33,000",
	},
];

const scopeMilestones = [
	{
		title: " Phase 1 - Site Readiness",
		weeks: "Weeks 1 - 4",
		description:
			"Network assessment, infrastructure readiness review, LIS discovery workshop.",
		icon: CiCalendar,
	},
	{
		title: "Phase 2 - Hardware Deployment",
		weeks: "Weeks 5 - 10",
		description:
			"Scanner installation, IMS configuration, cloud storage setup.",
		icon: HiOutlineWrenchScrewdriver,
	},
	{
		title: "Phase 3 - Integration & Validation",
		weeks: "Weeks 11 - 16",
		description:
			"LIS integration, HL7 testing, UAT, workflow validation sign-off.",
		icon: IoIosLink,
	},
	{
		title: "Phase 4 - Training & Go-Live",
		weeks: "Weeks 17 - 20",
		description:
			"Staff training, go-live support, handover documentation, SLA activation.",
		icon: GiGraduateCap,
	},
];

export default function ProposalPage() {
	return (
		<div className="min-h-screen bg-linear-to-br from-blue-500 via-blue-600 to-blue-700 proposal-heading">
			<Navigation activePage="proposal" />

			<div className="border-t border-blue-400/50">
				<div className="bg-white rounded-sm overflow-hidden shadow-lg ">
					<div className="flex justify-between bg-linear-to-r from-blue-900 via-blue-800 to-blue-600 px-6 py-8 text-white">
                        <div>
                            <div className="text-xs uppercase tracking-wider text-blue-100 mb-2">
							University of Texas Medical
						</div>
						<h1 className="text-3xl font-semibold leading-tight">
							Digital Pathology Solution
							<br />
							Proposal
						</h1>
						<p className="mt-2 text-sm text-blue-100">
							Prepared by: MedTech Solutions Group • sales@medtechgroup.com
						</p>
                        </div>
                        <div className="text-right">
                            <div className="text-xs uppercase tracking-wider text-blue-100 mb-2">
                                QUOTE REFERENCE
                            </div>
                            <h1 className="text-3xl font-semibold leading-tight">
							#UTM-2026-0042
						</h1>
                        <div className="flex items-center justify-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium tracking-wide text-blue-50 bg-blue-500 my-2 w-fit mx-auto">
  						<FaRegClock aria-hidden="true" />
  						<span>Valid until: Feb 20, 2026</span>
						</div>
                        </div>
						
                        
					</div>
                    

					<div className="px-6 py-5 border-b border-gray-200 bg-blue-50/60">
						<div className="grid grid-cols-1 md:grid-cols-[2fr_0.5fr_0.5fr_2fr] gap-6">
							<div>
								<p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
									Prepared For
								</p>
								<p className="text-xl font-semibold text-indigo-900">
									University of Texas Medical
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
									List Price
								</p>
								<p className="text-lg font-semibold text-gray-400 line-through">
									$2,241,500
								</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
									Your Net Price
								</p>
								<p className="text-3xl font-bold text-teal-500">$1,933,195</p>
							</div>
							<div>
								<p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
									Total Savings
								</p>
								<p className="text-2xl font-bold text-teal-600">$308,305 (14%)</p>
							</div>
						</div>

						<div className="mt-5 flex flex-wrap items-center justify-end gap-3">
							<button className="px-4 py-2 rounded-lg border-2 border-blue-300 text-blue-700 text-sm font-bold bg-white">
								<IoDocumentTextOutline className="inline mr-2 w-4 h-4" />Statement of Work
							</button>
							<button className="px-4 py-2 rounded-lg border-2 border-teal-300 text-teal-500 text-sm font-bold bg-teal-50">
								<LuShield className="inline mr-2 w-4 h-4" />
								Terms &amp; Conditions
							</button>
						</div>
					</div>

					<div className="px-6 py-6 border-b border-gray-200">
						<div className="border-l-4 border-blue-500 pl-4 text-gray-700 leading-7">
							This comprehensive proposal provides University of Texas Medical with a
							future-ready digital pathology solution designed to significantly improve
							turnaround times, enable seamless remote reading capabilities, and
							expand diagnostic capacity. The high-capacity scanning infrastructure,
							combined with cloud-based image management and integrated professional
							services, delivers a clinically validated platform that supports both
							current operational needs and future growth.
						</div>
					</div>

					<div className="px-6 py-6">
						<div className="flex items-center gap-3 mb-4">
							<h2 className="text-3xl font-semibold text-blue-900">Hardware &amp; Software</h2>
							<span className="inline-flex items-center px-3 py-1 rounded-full border border-blue-300 text-blue-700 text-xs font-semibold bg-blue-50">
								Bundle Discount Applied
							</span>
						</div>

						<div className="overflow-x-auto  rounded-sm">
							<table className="w-full table-fixed">
  								<colgroup>
    							<col className="w-[400px]" />
   								 <col />
    							<col />
    							<col />
    							<col />
  								</colgroup>
								<thead>
									<tr className="bg-blue-900 text-white text-xs uppercase tracking-wide">
										<th className="px-4 py-3 text-left ">Item</th>
										<th className="px-4 py-3 text-center">Qty</th>
										<th className="px-4 py-3 text-right">List Price</th>
										<th className="px-4 py-3 text-center">Discount</th>
										<th className="px-4 py-3 text-center">Net Price</th>
									</tr>
								</thead>
								<tbody>
									{lineItems.map((line, index) => (
										<tr
											key={line.item}
											className={`border-b border-gray-200 ${
												index % 2 === 0 ? "bg-white" : "bg-gray-50"
											}`}
										>
											<td className="px-4 py-4">
												<p className="font-semibold text-blue-900">{line.item}</p>
												<p className="text-sm text-blue-800 mt-1">{line.description}</p>
											</td>
											<td className="px-4 py-4 text-center text-gray-700">{line.qty}</td>
											<td className="px-4 py-4 text-right text-gray-400 line-through">
												{line.listPrice}
											</td>
											<td className="px-4 py-4 text-center">
												<span className="inline-flex items-center px-2 py-1 rounded bg-teal-100 text-teal-700 text-xs font-semibold">
													{line.discount}
												</span>
											</td>
											<td className="px-4 py-4 text-center font-semibold text-gray-900">
												{line.netPrice}
											</td>
										</tr>
									))}
									<tr className="bg-blue-50">
										<td className="px-4 py-4 text-right font-semibold text-gray-700" colSpan={4}>
											Hardware &amp; Software Subtotal
										</td>
										<td className="px-4 py-4 text-center font-bold text-gray-900">$822,150</td>
									</tr>
								</tbody>
							</table>
						</div>

						<p className="mt-4 text-sm text-gray-500">
							Approximate bundle value: $1,070K - covers hardware, licenses, and
							software upgrades. Bundle pricing applied for purchasing all items
							together.
						</p>
					</div>

					<div className="px-6 py-6">
						<h2 className="text-3xl font-semibold text-blue-900 mb-6">Professional Services</h2>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
							{professionalServices.map((service) => (
								<div
									key={service.title}
									className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow bg-white"
								>
									<h3 className="text-lg font-semibold text-blue-900 mb-2">
										{service.title}
									</h3>
									<p className="text-sm text-gray-600 mb-4 leading-6">
										{service.description}
									</p>
									<div className="flex items-baseline gap-2">
										<span className="text-xl font-bold text-teal-500">
											${service.netPrice.replace("$", "")}
										</span>
										<span className="text-lg text-gray-400 line-through">
											{service.listPrice}
										</span>
									</div>
								</div>
							))}
						</div>

						<div className="bg-blue-50 rounded-lg py-4 px-6 grid grid-cols-[0.5fr_auto_auto] items-center ">
							<div />
							<p className="text-lg font-semibold text-gray-700 text-right">
								Professional Services Subtotal
							</p>
							<p className="text-2xl font-bold text-gray-900 text-right">$457,045</p>
						</div>
					</div>

					<div className="px-6 pb-8">
						<h2 className="text-3xl font-semibold text-blue-900 mb-6">Statement of Work - Summary</h2>
						<div className="border border-gray-200 rounded-xl overflow-hidden">
							
							<div className="bg-blue-900 text-white px-6 py-4 text-sm font-semibold tracking-wide">
								Project Scope &amp; Milestones
							</div>
							<div className="p-6 bg-white">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									{scopeMilestones.map((phase) => (
										<div
											key={phase.title}
											className="rounded-lg border border-gray-200 bg-blue-50 px-4 py-4"
										>
											<div className="flex items-center gap-2">
												<phase.icon className="h-4 w-4 text-blue-600" aria-hidden="true" />
												<p className="text-sm font-semibold text-blue-900">{phase.title}</p>
											</div>
											<p className="text-xs text-gray-500 mt-1">{phase.weeks}</p>
											<p className="text-sm text-gray-600 mt-2 leading-6">
												{phase.description}
											</p>
										</div>
									))}
								</div>
								<p className="text-sm text-gray-600 mt-5">
									A full Statement of Work document is available for review and
									countersignature.{' '}
									<a className="inline-flex items-center gap-1 text-blue-700 font-semibold underline decoration-dotted decoration-2 decoration-blue-500 underline-offset-2" href="#">
										<ImArrowDown />Download Full SOW (PDF)
									</a>
								</p>
							</div>
						</div>

						<div className="mt-6 border border-gray-200 rounded-xl p-6 bg-blue-100/50">
							<p className="inline-flex items-center gap-1 text-sm font-semibold uppercase text-blue-900 tracking-wide mb-2">
								<GoChecklist /> Terms &amp; Conditions - Key Points
							</p>
							<p className="text-sm text-gray-400 leading-6">
								By accepting this quote, University of Texas Medical agrees to MedTech
								Solutions Group's standard{' '}
								<a className="inline-flex items-center gap-1 text-blue-500 font-semibold border-b-2 border-dotted border-blue-500 pb-[2px]" href="#">
									Terms &amp; Conditions (Full Document<TfiArrowTopRight className=" h-3 w-3"/>)
								</a>
								. Key highlights include:
							</p>
							<p className="mt-3 text-sm text-gray-400 leading-6">
								<strong className="text-black">Warranty:</strong> All hardware carries a 12-month on-site
								warranty from acceptance date. Software is covered under the SLA
								agreement.{' '}
								<strong className="text-black">Cancellation:</strong> Orders may be cancelled within 10 business
								days of PO issuance for a full refund. Post-shipment cancellations are
								subject to a 20% restocking fee.{' '}
								<strong className="text-black">Liability:</strong> MedTech's liability is limited to the invoice
								value of the goods and services provided.{' '}
								<strong className="text-black">Governing Law:</strong> This agreement is governed by the laws
								of the State of Texas.
							</p>
							<p className="mt-3 text-sm text-gray-400">
								Questions? Contact your account representative or review the{" "}
								
								<a
									href="#"
									className="inline-flex items-center gap-1 text-blue-500 font-semibold border-b-2 border-dotted border-blue-500 pb-[2px]"
								>
									full T&amp;C document
									<TfiArrowTopRight className="h-3 w-3" />
								</a>

								{" "}and{" "}

								<a
									href="#"
									className="inline-flex items-center gap-1 text-blue-500 font-semibold border-b-2 border-dotted border-blue-500 pb-[2px]"
								>
									Data Processing Agreement
									<TfiArrowTopRight className="h-3 w-3" />
								</a>
								.
							</p>
						</div>

						<div className="mt-6 rounded-xl bg-blue-900 px-6 py-5 text-white flex flex-col gap-4">
							<div>
								<p className="text-lg font-semibold">Ready to move forward?</p>
								<p className="text-sm text-blue-100">
									Accept this quote or contact us to discuss customizations, payment
									plans, or additional discounts.
								</p>
							</div>
							<div className="flex flex-wrap gap-3">
								<button className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-blue-400 text-blue-100 text-sm font-semibold">
									<CiChat1 />Ask a Question
								</button>
								<button className="inline-flex items-center gap-1 px-4 py-2 rounded-lg border border-blue-400 text-blue-100 text-sm font-semibold">
									<IoIosArrowDown />Download PDF
								</button>
								<button className="inline-flex items-center gap-1 px-4 py-2 rounded-lg bg-teal-500 text-white text-sm font-semibold">
									<TiTick /> Accept &amp; Sign Quote
								</button>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}