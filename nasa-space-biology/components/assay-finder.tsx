"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { Loader2, Sparkles, Telescope } from "lucide-react"

import { cn } from "@/lib/utils"
import { useAPI } from "@/APIContext"

type AssayEntry = {
  dataset: string
  assay_name: string
  organism: string
  assay_technology: string
  conditions: string[]
  link: string
  dataset_link: string
  has_flight: boolean
  has_ground: boolean
  has_both_flight_ground: boolean
}

type AssayCategory = {
  technology: string
  count: number
  assays: AssayEntry[]
}

const exampleData: AssayCategory[] = [
  {
    technology: "RNA Sequencing",
    count: 75,
    assays: [
      {
        dataset: "OSD-100",
        assay_name: "OSD-100_transcription-profiling_rna-sequencing-(rna-seq)",
        organism: "Mus musculus",
        assay_technology: "RNA Sequencing",
        conditions: ["Ground Control", "Space Flight"],
        link: "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/?id.accession=OSD-100&id.assay%20name=OSD-100_transcription-profiling_rna-sequencing-%28rna-seq%29&study.characteristics&study.factor%20value&assay.parameter%20value&file.data%20type&format=html",
        dataset_link: "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-100/?format=html",
        has_flight: true,
        has_ground: true,
        has_both_flight_ground: true,
      },
      {
        dataset: "OSD-101",
        assay_name: "OSD-101_transcription-profiling_rna-sequencing-(rna-seq)_Illumina",
        organism: "Mus musculus",
        assay_technology: "RNA Sequencing",
        conditions: ["Ground Control", "Space Flight"],
        link: "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/?id.accession=OSD-101&id.assay%20name=OSD-101_transcription-profiling_rna-sequencing-%28rna-seq%29_Illumina&study.characteristics&study.factor%20value&assay.parameter%20value&file.data%20type&format=html",
        dataset_link: "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-101/?format=html",
        has_flight: true,
        has_ground: true,
        has_both_flight_ground: true,
      },
      {
        dataset: "OSD-102",
        assay_name: "OSD-102_transcription-profiling_rna-sequencing-(rna-seq)_Illumina HiSeq 4000",
        organism: "Mus musculus",
        assay_technology: "RNA Sequencing",
        conditions: ["Ground Control", "Space Flight"],
        link: "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/?id.accession=OSD-102&id.assay%20name=OSD-102_transcription-profiling_rna-sequencing-%28rna-seq%29_Illumina%20HiSeq%204000&study.characteristics&study.factor%20value&assay.parameter%20value&file.data%20type&format=html",
        dataset_link: "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-102/?format=html",
        has_flight: true,
        has_ground: true,
        has_both_flight_ground: true,
      },
    ],
  },
  {
    technology: "DNA microarray",
    count: 14,
    assays: [
      {
        dataset: "OSD-111",
        assay_name: "OSD-111_transcription-profiling_dna-microarray_affymetrix",
        organism: "Mus musculus",
        assay_technology: "DNA microarray",
        conditions: ["Ground Control", "Space Flight", "Vivarium Control"],
        link: "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/?id.accession=OSD-111&id.assay%20name=OSD-111_transcription-profiling_dna-microarray_affymetrix&study.characteristics&study.factor%20value&assay.parameter%20value&file.data%20type&format=html",
        dataset_link: "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-111/?format=html",
        has_flight: true,
        has_ground: true,
        has_both_flight_ground: true,
      },
      {
        dataset: "OSD-135",
        assay_name: "OSD-135_transcription-profiling_dna-microarray_affymetrix",
        organism: "Mus musculus",
        assay_technology: "DNA microarray",
        conditions: ["Ground Control", "Space Flight", "Vivarium Control"],
        link: "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/?id.accession=OSD-135&id.assay%20name=OSD-135_transcription-profiling_dna-microarray_affymetrix&study.characteristics&study.factor%20value&assay.parameter%20value&file.data%20type&format=html",
        dataset_link: "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-135/?format=html",
        has_flight: true,
        has_ground: true,
        has_both_flight_ground: true,
      },
      {
        dataset: "OSD-21",
        assay_name: "OSD-21_transcription-profiling_dna-microarray_affymetrix",
        organism: "Mus musculus",
        assay_technology: "DNA microarray",
        conditions: ["Ground Control", "Space Flight"],
        link: "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/?id.accession=OSD-21&id.assay%20name=OSD-21_transcription-profiling_dna-microarray_affymetrix&study.characteristics&study.factor%20value&assay.parameter%20value&file.data%20type&format=html",
        dataset_link: "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-21/?format=html",
        has_flight: true,
        has_ground: true,
        has_both_flight_ground: true,
      },
    ],
  },
  {
    technology: "single-cell RNA sequencing",
    count: 3,
    assays: [
      {
        dataset: "OSD-352",
        assay_name: "OSD-352_transcription-profiling_single-cell-rna-sequencing_illumina",
        organism: "Mus musculus",
        assay_technology: "single-cell RNA sequencing",
        conditions: ["Ground Control", "Space Flight"],
        link: "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/?id.accession=OSD-352&id.assay%20name=OSD-352_transcription-profiling_single-cell-rna-sequencing_illumina&study.characteristics&study.factor%20value&assay.parameter%20value&file.data%20type&format=html",
        dataset_link: "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-352/?format=html",
        has_flight: true,
        has_ground: true,
        has_both_flight_ground: true,
      },
      {
        dataset: "OSD-612",
        assay_name: "OSD-612_transcription-profiling_single-cell-rna-sequencing_Illumina",
        organism: "Mus musculus",
        assay_technology: "single-cell RNA sequencing",
        conditions: ["Ground Control", "Space Flight"],
        link: "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/?id.accession=OSD-612&id.assay%20name=OSD-612_transcription-profiling_single-cell-rna-sequencing_Illumina&study.characteristics&study.factor%20value&assay.parameter%20value&file.data%20type&format=html",
        dataset_link: "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-612/?format=html",
        has_flight: true,
        has_ground: true,
        has_both_flight_ground: true,
      },
      {
        dataset: "OSD-613",
        assay_name: "OSD-613_transcription-profiling_single-cell-rna-sequencing_Illumina",
        organism: "Mus musculus",
        assay_technology: "single-cell RNA sequencing",
        conditions: ["Ground Control", "Space Flight"],
        link: "https://visualization.osdr.nasa.gov/biodata/api/v2/query/metadata/?id.accession=OSD-613&id.assay%20name=OSD-613_transcription-profiling_single-cell-rna-sequencing_Illumina&study.characteristics&study.factor%20value&assay.parameter%20value&file.data%20type&format=html",
        dataset_link: "https://visualization.osdr.nasa.gov/biodata/api/v2/dataset/OSD-613/?format=html",
        has_flight: true,
        has_ground: true,
        has_both_flight_ground: true,
      },
    ],
  },
]


export function AssayFinder() {
  const { assays } = useAPI()
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [results, setResults] = useState<AssayCategory[] | null>(null)
  const [isSample, setIsSample] = useState(false)

  const totalAssays = useMemo(() => {
    if (!results) return 0
    return results.reduce((sum, category) => sum + category.assays.length, 0)
  }, [results])

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!prompt.trim()) {
      setError("Please enter a query to search for assays.")
      setResults(null)
      setIsSample(false)
      return
    }

    setError(null)
    setLoading(true)
    setIsSample(false)

    try {
      const response = await assays.search<AssayCategory[]>(prompt.trim())
      console.log("Search response:", response)
      if (!response) {
        setError("No response from the assay service.")
        setResults(null)
        return
      }

      const data = response.data ?? null
      if (!data || !Array.isArray(data) || data.length === 0) {
        setError("No assays were found for this search.")
        setResults(null)
        return
      }

      setResults(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to fetch assay information.")
      setResults(null)
    } finally {
      setLoading(false)
    }
  }

  const handleUseSample = () => {
    setPrompt("Show me all RNA sequencing assays with flight and ground controls")
    setResults(exampleData)
    setError(null)
    setIsSample(true)
  }

  return (
    <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-12 px-4 pb-24 pt-28">
      <header className="text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1 font-mono text-xs uppercase tracking-[0.3em] text-sky-200">
          <Sparkles className="h-3.5 w-3.5" /> Assay Finder
        </div>
        <h1 className="text-balance font-mono text-4xl font-bold text-white sm:text-5xl">
          Discover NASA&apos;s Space Biology Assays
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-balance text-base text-slate-200/80 sm:text-lg">
          Describe the experiment you&apos;re looking for and we&apos;ll surface matching assays, grouped by technology. Each
          card highlights dataset details, environmental conditions, and direct links to NASA&apos;s Open Science Data Repository.
        </p>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-slate-500/30 bg-slate-900/60 shadow-[0_0_40px_-20px_rgba(56,189,248,0.7)] backdrop-blur-xl">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/20 via-transparent to-purple-500/10" />
        <div className="relative flex flex-col gap-6 p-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 text-slate-100">
              <Telescope className="h-5 w-5 text-sky-300" />
              <span className="font-mono text-sm uppercase tracking-[0.3em] text-slate-200/80">Prompt</span>
            </div>
            <button
              type="button"
              onClick={handleUseSample}
              className="inline-flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-500/10 px-4 py-2 text-xs font-medium text-sky-100 transition hover:border-sky-300/60 hover:bg-sky-500/20"
            >
              Load sample response
            </button>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="e.g. Assays with single-cell RNA sequencing involving space flight and ground controls"
              className="min-h-[140px] w-full rounded-2xl border border-slate-700/70 bg-slate-950/80 p-4 font-mono text-sm text-slate-100 outline-none transition focus:border-sky-400/60 focus:ring-2 focus:ring-sky-500/20"
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-slate-300/70">
                We call the `/assays/search` backend endpoint with your query. Use the sample button above if you want to
                preview the example payload.
              </p>
              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "inline-flex items-center justify-center gap-2 rounded-full border px-6 py-2 text-sm font-semibold transition",
                  loading
                    ? "border-slate-700/80 bg-slate-900/60 text-slate-400"
                    : "border-sky-400/60 bg-sky-500/20 text-sky-100 hover:border-sky-300/80 hover:bg-sky-500/30",
                )}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Contacting NASA...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Find assays
                  </>
                )}
              </button>
            </div>
          </form>

          {error ? (
            <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-200/90">
              {error}
            </div>
          ) : null}
        </div>
      </section>

      {results ? (
        <section className="space-y-10">
          <header className="flex flex-col gap-2 text-slate-100 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="font-mono text-2xl font-semibold text-white">Results by Assay Technology</h2>
              <p className="text-sm text-slate-300/80">
                {results.length} technology buckets · {totalAssays} assays surfaced · {isSample ? "Sample data" : "Live data"}
              </p>
            </div>
          </header>

          <div className="space-y-10">
            {results.map((category) => (
              <article
                key={category.technology}
                className="relative overflow-hidden rounded-3xl border border-slate-600/40 bg-gradient-to-br from-slate-950/90 via-slate-900/80 to-slate-950/80 p-8 shadow-[0_0_45px_-25px_rgba(14,165,233,0.7)]"
              >
                <div className="absolute inset-0 opacity-60 blur-3xl [background:radial-gradient(circle_at_top_right,rgba(56,189,248,0.22),transparent_55%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.25),transparent_55%)]" />

                <div className="relative z-10">
                  <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-mono text-xs uppercase tracking-[0.35em] text-slate-200/70">Technology</p>
                      <h3 className="mt-1 font-mono text-3xl font-bold text-white">{category.technology}</h3>
                    </div>
                    <div className="inline-flex items-center gap-2 rounded-full border border-slate-500/60 bg-slate-800/70 px-4 py-1.5 font-mono text-xs uppercase tracking-[0.35em] text-slate-200">
                      {category.count} assays in catalog
                    </div>
                  </header>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {category.assays.map((assay) => {
                      const conditionBadges = assay.conditions.map((condition) => ({
                        label: condition,
                        tone: condition.toLowerCase().includes("space") ? "from-purple-500/30" : "from-sky-500/30",
                      }))

                      const availabilityBadges = [
                        assay.has_flight ? "Flight" : null,
                        assay.has_ground ? "Ground" : null,
                        assay.has_both_flight_ground ? "Flight + Ground" : null,
                      ].filter(Boolean)

                      return (
                        <div
                          key={assay.assay_name}
                          className="group relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/70 p-6 transition duration-300 hover:border-sky-400/50 hover:bg-slate-900/90"
                        >
                          <div className="absolute inset-0 opacity-0 transition duration-300 group-hover:opacity-100 [background:radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_60%)]" />

                          <div className="relative z-10 flex flex-col gap-4">
                            <div>
                              <p className="font-mono text-xs uppercase tracking-[0.3em] text-slate-300/80">Dataset</p>
                              <h4 className="text-balance font-mono text-xl font-semibold text-white">{assay.dataset}</h4>
                              <p className="mt-1 text-sm text-slate-300/80">{assay.assay_name}</p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                              {conditionBadges.map((badge) => (
                                <span
                                  key={badge.label}
                                  className={cn(
                                    "inline-flex items-center rounded-full border border-slate-600/60 bg-gradient-to-r px-3 py-1 text-[11px] font-medium text-slate-100",
                                    badge.tone,
                                  )}
                                >
                                  {badge.label}
                                </span>
                              ))}
                              {availabilityBadges.length ? (
                                <span className="inline-flex items-center rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-medium text-emerald-200">
                                  {availabilityBadges.join(" · ")}
                                </span>
                              ) : null}
                            </div>

                            <dl className="grid gap-2 text-xs text-slate-300/80">
                              <div className="flex gap-2">
                                <dt className="font-mono uppercase tracking-[0.25em] text-slate-400">Organism</dt>
                                <dd className="text-slate-200">{assay.organism}</dd>
                              </div>
                              <div className="flex gap-2">
                                <dt className="font-mono uppercase tracking-[0.25em] text-slate-400">Technology</dt>
                                <dd className="text-slate-200">{assay.assay_technology}</dd>
                              </div>
                            </dl>

                            <div className="flex flex-wrap gap-3 text-sm">
                              <Link
                                href={assay.dataset_link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-sky-400/60 bg-sky-500/10 px-3 py-1 text-xs font-semibold text-sky-200 transition hover:border-sky-300/80 hover:bg-sky-500/20"
                              >
                                Dataset
                              </Link>
                              <Link
                                href={assay.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 rounded-full border border-slate-500/60 bg-slate-800/70 px-3 py-1 text-xs font-semibold text-slate-200 transition hover:border-slate-400/70 hover:text-white"
                              >
                                Metadata
                              </Link>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : (
        <section className="rounded-3xl border border-slate-600/40 bg-slate-900/70 p-10 text-center text-slate-300/80">
          <p className="mx-auto max-w-2xl text-balance">
            Submit a prompt to explore NASA&apos;s assay catalog. We&apos;ll group the response by technology so you can quickly
            scan for relevant experiments and jump into the datasets that matter.
          </p>
        </section>
      )}
    </div>
  )
}
