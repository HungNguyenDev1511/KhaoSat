using Microsoft.AspNetCore.Mvc;
using KhaoSat.Models;
using KhaoSat.Services;

namespace KhaoSat.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SurveysController : ControllerBase
    {
        private readonly ISurveyService _surveyService;

        public SurveysController(ISurveyService surveyService)
        {
            _surveyService = surveyService;
        }

        [HttpGet]
        public async Task<ActionResult<IEnumerable<Survey>>> GetSurveys()
        {
            return Ok(await _surveyService.GetAllSurveysAsync());
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<Survey>> GetSurvey(int id)
        {
            var survey = await _surveyService.GetSurveyByIdAsync(id);
            if (survey == null) return NotFound();
            return Ok(survey);
        }

        [HttpPost]
        public async Task<ActionResult<Survey>> CreateSurvey(Survey survey)
        {
            var created = await _surveyService.CreateSurveyAsync(survey);
            return CreatedAtAction(nameof(GetSurvey), new { id = created.Id }, created);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSurvey(int id, Survey survey)
        {
            var success = await _surveyService.UpdateSurveyAsync(id, survey);
            if (!success) return BadRequest();
            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSurvey(int id)
        {
            var success = await _surveyService.DeleteSurveyAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }

        [HttpPost("{id}/responses")]
        public async Task<ActionResult<SurveyResponse>> SubmitResponse(int id, SurveyResponse response)
        {
            var res = await _surveyService.SubmitResponseAsync(id, response);
            return Ok(res);
        }
    }
}
