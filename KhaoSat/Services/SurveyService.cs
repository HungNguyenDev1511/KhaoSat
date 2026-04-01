using KhaoSat.Models;
using KhaoSat.Repositories;
using Microsoft.EntityFrameworkCore;
using KhaoSat.Data;

namespace KhaoSat.Services
{
    public interface ISurveyService
    {
        Task<IEnumerable<Survey>> GetAllSurveysAsync();
        Task<Survey?> GetSurveyByIdAsync(int id);
        Task<Survey> CreateSurveyAsync(Survey survey);
        Task<bool> UpdateSurveyAsync(int id, Survey survey);
        Task<bool> DeleteSurveyAsync(int id);
        Task<SurveyResponse> SubmitResponseAsync(int surveyId, SurveyResponse response);
    }

    public class SurveyService : ISurveyService
    {
        private readonly IRepository<Survey> _surveyRepo;
        private readonly IRepository<Question> _questionRepo;
        private readonly IRepository<SurveyResponse> _responseRepo;
        private readonly ApplicationDbContext _context; // To handle question re-sync easily

        public SurveyService(
            IRepository<Survey> surveyRepo, 
            IRepository<Question> questionRepo, 
            IRepository<SurveyResponse> responseRepo,
            ApplicationDbContext context) // Sometimes context is still useful for deep entity management
        {
            _surveyRepo = surveyRepo;
            _questionRepo = questionRepo;
            _responseRepo = responseRepo;
            _context = context;
        }

        public async Task<IEnumerable<Survey>> GetAllSurveysAsync()
        {
            // Usually repository should handle Includes, but for now I'll just keep it simple or use find with includes
            // Actually, for demo I'll just use the context for now to show logic move
            return await _context.Surveys.Include(s => s.Questions).ToListAsync();
        }

        public async Task<Survey?> GetSurveyByIdAsync(int id)
        {
            return await _context.Surveys.Include(s => s.Questions).FirstOrDefaultAsync(s => s.Id == id);
        }

        public async Task<Survey> CreateSurveyAsync(Survey survey)
        {
            await _surveyRepo.AddAsync(survey);
            await _surveyRepo.SaveChangesAsync();
            return survey;
        }

        public async Task<bool> UpdateSurveyAsync(int id, Survey survey)
        {
            // Fetch existing survey with tracking
            var existingSurvey = await _context.Surveys
                .Include(s => s.Questions)
                .FirstOrDefaultAsync(s => s.Id == id);

            if (existingSurvey == null) return false;

            // Update basic fields
            existingSurvey.Title = survey.Title;
            existingSurvey.Description = survey.Description;
            existingSurvey.IsActive = survey.IsActive;

            // Sync Questions
            // 1. Remove questions that are no longer in the new list
            foreach (var existingQuestion in existingSurvey.Questions.ToList())
            {
                if (!survey.Questions.Any(q => q.Id == existingQuestion.Id))
                    _context.Questions.Remove(existingQuestion);
            }

            // 2. Add or Update questions
            foreach (var question in survey.Questions)
            {
                var existingQuestion = existingSurvey.Questions
                    .FirstOrDefault(q => q.Id == question.Id && q.Id != 0);

                if (existingQuestion != null)
                {
                    // Update
                    existingQuestion.Text = question.Text;
                    existingQuestion.Type = question.Type;
                    existingQuestion.Options = question.Options;
                }
                else
                {
                    // Add new
                    existingSurvey.Questions.Add(new Question
                    {
                        Text = question.Text,
                        Type = question.Type,
                        Options = question.Options,
                        SurveyId = id
                    });
                }
            }

            try 
            { 
                await _context.SaveChangesAsync(); 
            }
            catch (DbUpdateConcurrencyException) 
            { 
                return false; 
            }
            return true;
        }

        public async Task<bool> DeleteSurveyAsync(int id)
        {
            var survey = await _surveyRepo.GetByIdAsync(id);
            if (survey == null) return false;
            
            _surveyRepo.Remove(survey);
            await _surveyRepo.SaveChangesAsync();
            return true;
        }

        public async Task<SurveyResponse> SubmitResponseAsync(int surveyId, SurveyResponse response)
        {
            response.SurveyId = surveyId;
            response.SubmittedAt = DateTime.UtcNow;
            await _responseRepo.AddAsync(response);
            await _responseRepo.SaveChangesAsync();
            return response;
        }
    }
}
