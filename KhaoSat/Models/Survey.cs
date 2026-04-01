namespace KhaoSat.Models
{
    public class Survey
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public bool IsActive { get; set; } = true;
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        public List<Question> Questions { get; set; } = new();
    }

    public class Question
    {
        public int Id { get; set; }
        public int SurveyId { get; set; }
        public string Text { get; set; } = string.Empty;
        public string Type { get; set; } = "text"; // text, rating, choice
        public string? Options { get; set; } // For choice type: option1|option2|option3
    }
}
