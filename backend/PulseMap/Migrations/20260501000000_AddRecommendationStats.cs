using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PulseMap.Migrations
{
    /// <inheritdoc />
    public partial class AddRecommendationStats : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "RecommendationRequestsTotal",
                table: "AIStatistics",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RecommendationAiSuccess",
                table: "AIStatistics",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "RecommendationFallbackCalls",
                table: "AIStatistics",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RecommendationRequestsTotal",
                table: "AIStatistics");

            migrationBuilder.DropColumn(
                name: "RecommendationAiSuccess",
                table: "AIStatistics");

            migrationBuilder.DropColumn(
                name: "RecommendationFallbackCalls",
                table: "AIStatistics");
        }
    }
}
