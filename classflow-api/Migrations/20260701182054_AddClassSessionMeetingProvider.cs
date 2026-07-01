using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ClassFlow.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddClassSessionMeetingProvider : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "MeetingProvider",
                table: "ClassSessions",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "MeetingProvider",
                table: "ClassSessions");
        }
    }
}
