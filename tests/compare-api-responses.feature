Feature: API Response Comparison

  Scenario Outline: Compare read-only responses between original API and current API
    Given I call the original API at "<originalApiUrl>" with entity "<Entity>", action "<Action>", and params "<Params>"
    And I call the current API at "<currentApiUrl>" with entity "<Entity>", action "<Action>", and params "<Params>"
    Then the response from the original API should match the response from the current API

    Examples:
      | originalApiUrl        | currentApiUrl         | Entity       | Action     | Params |
      | http://localhost:8081 | http://localhost:3000 | Types        | GetObject  |        |
      | http://localhost:8081 | http://localhost:3000 | TypesGroepen | GetObjects |        |
