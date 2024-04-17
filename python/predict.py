from recbole.quick_start import load_data_and_model
from recbole.utils.case_study import full_sort_scores

# Load trained model and dataset
config, model, dataset, train_data, valid_data, test_data = load_data_and_model(
    model_file='saved/BPR-Apr-05-2024_20-37-57.pth'  # Update with your model's filename
)

external_user_id = '1'  # External user ID as a string
if external_user_id in dataset.uid_field2id:  # Ensure the user ID exists in the dataset
    internal_user_id = dataset.uid_field2id[external_user_id]
    # Generate recommendations
    _, topk_iid_list = full_sort_scores(uid_series=internal_user_id, model=model, test_data=test_data, k=10, device=config['device'])

    # Convert internal item IDs back to their original format (FoodID)
    recommended_food_ids = [dataset.iid_field2id.inverse[iid] for iid in topk_iid_list[0]]
    print(recommended_food_ids)
else:
    print(f"User ID {external_user_id} not found in dataset.")