namespace KhaoSat.Models
{
    public class SurveyResponse
    {
        public int Id { get; set; }
        public int SurveyId { get; set; }
        public string SubmitterName { get; set; } = "Anonymous";
        public DateTime SubmittedAt { get; set; } = DateTime.UtcNow;
        public List<Answer> Answers { get; set; } = new();
    }

    public class Answer
    {
        public int Id { get; set; }
        public int SurveyResponseId { get; set; }
        public int QuestionId { get; set; }
        public string Value { get; set; } = string.Empty;
    }
}
