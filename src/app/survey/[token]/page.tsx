import { SurveyForm } from "@/modules/survey/components/SurveyForm"

export default async function SurveyPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <SurveyForm token={token} />
}
