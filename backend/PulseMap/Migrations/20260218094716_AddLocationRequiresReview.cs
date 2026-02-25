using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PulseMap.Migrations
{
    /// <inheritdoc />
    public partial class AddLocationRequiresReview : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "RequiresReview",
                table: "Locations",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "RequiresReview",
                table: "Locations");
        }
    }
}
